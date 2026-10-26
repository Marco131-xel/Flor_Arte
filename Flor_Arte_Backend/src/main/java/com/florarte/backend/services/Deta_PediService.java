package com.florarte.backend.services;

import com.florarte.backend.dtos.Deta_PediDTO;
import com.florarte.backend.entities.Detalle_Pedido;
import com.florarte.backend.entities.Flor;
import com.florarte.backend.entities.Movimiento_Inventario;
import com.florarte.backend.entities.Pedido;
import com.florarte.backend.repositories.Deta_PediRepository;
import com.florarte.backend.repositories.FlorRepository;
import com.florarte.backend.repositories.Mov_InvRepository;
import com.florarte.backend.repositories.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class Deta_PediService {

    private final Deta_PediRepository detaPediRepository;
    private final PedidoRepository pedidoRepository;
    private final FlorRepository florRepository;
    private final Mov_InvRepository movInvRepository;

    @Autowired
    public Deta_PediService(Deta_PediRepository detaPediRepository,
                            PedidoRepository pedidoRepository,
                            FlorRepository florRepository,
                            Mov_InvRepository movInvRepository) {
        this.detaPediRepository = detaPediRepository;
        this.pedidoRepository = pedidoRepository;
        this.florRepository = florRepository;
        this.movInvRepository = movInvRepository;
    }

    // Crear un detalle de pedido
    @Transactional
    public Deta_PediDTO save(Deta_PediDTO dto) {
        Pedido pedido = pedidoRepository.findById(dto.getIdPedido())
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + dto.getIdPedido()));

        if ("CANCELADO".equalsIgnoreCase(pedido.getEstado())) {
            throw new IllegalArgumentException("No se pueden agregar detalles a un pedido cancelado");
        }

        Flor flor = florRepository.findByIdWithDetails(dto.getIdFlor())
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + dto.getIdFlor()));

        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        // Validar stock disponible
        if (flor.getStock() < dto.getCantidad()) {
            throw new IllegalArgumentException("Stock insuficiente para la flor (" + obtenerNombreFlor(flor)
                    + "). Stock actual: " + flor.getStock() + ", solicitado: " + dto.getCantidad());
        }

        // Descontar stock
        flor.setStock(flor.getStock() - dto.getCantidad());
        florRepository.save(flor);

        // Registrar movimiento de salida por venta en movimiento_inventario
        Movimiento_Inventario mov = new Movimiento_Inventario();
        mov.setIdFlor(dto.getIdFlor());
        mov.setTipoMovimiento("SALIDA");
        mov.setCantidad(dto.getCantidad());
        mov.setMotivo("VENTA");
        mov.setFecha(LocalDateTime.now());
        movInvRepository.save(mov);

        BigDecimal precio = dto.getPrecio() != null && dto.getPrecio().compareTo(BigDecimal.ZERO) >= 0
                ? dto.getPrecio()
                : flor.getPrecio();
        BigDecimal subtotal = precio.multiply(BigDecimal.valueOf(dto.getCantidad()));

        Detalle_Pedido detalle = new Detalle_Pedido();
        detalle.setIdPedido(dto.getIdPedido());
        detalle.setIdFlor(dto.getIdFlor());
        detalle.setCantidad(dto.getCantidad());
        detalle.setPrecio(precio);
        detalle.setSubtotal(subtotal);

        Detalle_Pedido guardado = detaPediRepository.save(detalle);

        // Actualizar total en el pedido
        actualizarTotalPedido(dto.getIdPedido());

        return toDto(guardado, obtenerNombreFlor(flor));
    }

    // Listar todos los detalles de pedidos
    public List<Deta_PediDTO> findAll() {
        return detaPediRepository.findAllWithFlor()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Buscar detalle por id
    public Optional<Deta_PediDTO> findById(Integer id) {
        return detaPediRepository.findByIdWithFlor(id).map(this::toDto);
    }

    // Buscar detalles por id de pedido
    public List<Deta_PediDTO> findByPedido(Integer idPedido) {
        return detaPediRepository.findByIdPedidoWithFlor(idPedido)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Actualizar detalle de pedido
    @Transactional
    public Deta_PediDTO update(Integer id, Deta_PediDTO dto) {
        Detalle_Pedido detalle = detaPediRepository.findByIdWithFlor(id)
                .orElseThrow(() -> new RuntimeException("Detalle de pedido no encontrado con id: " + id));

        Flor flor = florRepository.findByIdWithDetails(dto.getIdFlor())
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + dto.getIdFlor()));

        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        // Reajuste de stock si cambió la cantidad o la flor
        int diffCantidad = dto.getCantidad() - detalle.getCantidad();
        if (detalle.getIdFlor().equals(dto.getIdFlor())) {
            if (diffCantidad > 0 && flor.getStock() < diffCantidad) {
                throw new IllegalArgumentException("Stock insuficiente para aumentar la cantidad. Stock adicional necesario: "
                        + diffCantidad + ", disponible: " + flor.getStock());
            }
            flor.setStock(flor.getStock() - diffCantidad);
            florRepository.save(flor);

            if (diffCantidad != 0) {
                Movimiento_Inventario mov = new Movimiento_Inventario();
                mov.setIdFlor(dto.getIdFlor());
                mov.setTipoMovimiento(diffCantidad > 0 ? "SALIDA" : "ENTRADA");
                mov.setCantidad(Math.abs(diffCantidad));
                mov.setMotivo("VENTA");
                mov.setFecha(LocalDateTime.now());
                movInvRepository.save(mov);
            }
        } else {
            // Se cambió de flor: devolver stock a la flor anterior y descontar de la nueva
            Flor florAnterior = florRepository.findById(detalle.getIdFlor())
                    .orElseThrow(() -> new RuntimeException("Flor anterior no encontrada"));
            florAnterior.setStock(florAnterior.getStock() + detalle.getCantidad());
            florRepository.save(florAnterior);

            if (flor.getStock() < dto.getCantidad()) {
                throw new IllegalArgumentException("Stock insuficiente para la nueva flor seleccionada. Disponible: " + flor.getStock());
            }
            flor.setStock(flor.getStock() - dto.getCantidad());
            florRepository.save(flor);

            Movimiento_Inventario mov = new Movimiento_Inventario();
            mov.setIdFlor(dto.getIdFlor());
            mov.setTipoMovimiento("SALIDA");
            mov.setCantidad(dto.getCantidad());
            mov.setMotivo("VENTA");
            mov.setFecha(LocalDateTime.now());
            movInvRepository.save(mov);
        }

        BigDecimal precio = dto.getPrecio() != null && dto.getPrecio().compareTo(BigDecimal.ZERO) >= 0
                ? dto.getPrecio()
                : flor.getPrecio();
        BigDecimal subtotal = precio.multiply(BigDecimal.valueOf(dto.getCantidad()));

        detalle.setIdFlor(dto.getIdFlor());
        detalle.setCantidad(dto.getCantidad());
        detalle.setPrecio(precio);
        detalle.setSubtotal(subtotal);

        Detalle_Pedido actualizado = detaPediRepository.save(detalle);
        actualizarTotalPedido(detalle.getIdPedido());

        return toDto(actualizado, obtenerNombreFlor(flor));
    }

    // Eliminar detalle de pedido
    @Transactional
    public void deleteById(Integer id) {
        Detalle_Pedido detalle = detaPediRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Detalle de pedido no encontrado con id: " + id));

        // Devolver stock a la flor
        Flor flor = florRepository.findById(detalle.getIdFlor()).orElse(null);
        if (flor != null) {
            flor.setStock(flor.getStock() + detalle.getCantidad());
            florRepository.save(flor);

            Movimiento_Inventario mov = new Movimiento_Inventario();
            mov.setIdFlor(detalle.getIdFlor());
            mov.setTipoMovimiento("ENTRADA");
            mov.setCantidad(detalle.getCantidad());
            mov.setMotivo("VENTA");
            mov.setFecha(LocalDateTime.now());
            movInvRepository.save(mov);
        }

        Integer idPedido = detalle.getIdPedido();
        detaPediRepository.deleteById(id);

        actualizarTotalPedido(idPedido);
    }

    private void actualizarTotalPedido(Integer idPedido) {
        List<Detalle_Pedido> detalles = detaPediRepository.findByIdPedido(idPedido);
        BigDecimal total = detalles.stream()
                .map(Detalle_Pedido::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        pedidoRepository.findById(idPedido).ifPresent(p -> {
            p.setTotal(total);
            pedidoRepository.save(p);
        });
    }

    private String obtenerNombreFlor(Flor flor) {
        if (flor == null) return null;
        String tipo = flor.getTipoFlor() != null ? flor.getTipoFlor().getNombre() : "";
        String color = flor.getColor() != null ? flor.getColor().getNombre() : "";
        return (tipo + " " + color).trim();
    }

    private Deta_PediDTO toDto(Detalle_Pedido d) {
        return toDto(d, obtenerNombreFlor(d.getFlor()));
    }

    private Deta_PediDTO toDto(Detalle_Pedido d, String nombreFlor) {
        return new Deta_PediDTO(
                d.getIdDetallePedido(),
                d.getIdPedido(),
                d.getIdFlor(),
                nombreFlor,
                d.getCantidad(),
                d.getPrecio(),
                d.getSubtotal()
        );
    }
}
