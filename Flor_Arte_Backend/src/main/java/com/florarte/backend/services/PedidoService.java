package com.florarte.backend.services;

import com.florarte.backend.dtos.Deta_PediDTO;
import com.florarte.backend.dtos.PedidoDTO;
import com.florarte.backend.dtos.UpdatePedidoCompletoDTO;
import com.florarte.backend.entities.*;
import com.florarte.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Locale;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PedidoService {

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "PENDIENTE",
            "CONFIRMADO",
            "PREPARANDO",
            "LISTO",
            "ENTREGADO",
            "CANCELADO"
    );

    private final PedidoRepository pedidoRepository;
    private final PersonaRepository personaRepository;
    private final Deta_PediRepository detaPediRepository;
    private final FlorRepository florRepository;
    private final Mov_InvRepository movInvRepository;

    @Autowired
    public PedidoService(PedidoRepository pedidoRepository,
                         PersonaRepository personaRepository,
                         Deta_PediRepository detaPediRepository,
                         FlorRepository florRepository,
                         Mov_InvRepository movInvRepository) {
        this.pedidoRepository = pedidoRepository;
        this.personaRepository = personaRepository;
        this.detaPediRepository = detaPediRepository;
        this.florRepository = florRepository;
        this.movInvRepository = movInvRepository;
    }

    // Crear un nuevo pedido
    @Transactional
    public PedidoDTO save(PedidoDTO dto) {
        Persona cliente = personaRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + dto.getIdCliente()));

        Persona empleado = null;
        if (dto.getIdEmpleado() != null) {
            empleado = personaRepository.findById(dto.getIdEmpleado())
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + dto.getIdEmpleado()));
        }

        String estado = dto.getEstado() != null ? dto.getEstado().trim().toUpperCase() : "PENDIENTE";
        if (!ESTADOS_VALIDOS.contains(estado)) {
            throw new IllegalArgumentException("Estado inválido: " + dto.getEstado() + ". Permitidos: " + ESTADOS_VALIDOS);
        }

        Pedido pedido = new Pedido();
        pedido.setIdCliente(dto.getIdCliente());
        pedido.setIdEmpleado(dto.getIdEmpleado());
        pedido.setEstado(estado);
        pedido.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDateTime.now());
        pedido.setTotal(BigDecimal.ZERO);

        Pedido guardado = pedidoRepository.save(pedido);

        // Si se enviaron detalles en la misma petición de creación
        List<Deta_PediDTO> detallesGuardados = new ArrayList<>();
        BigDecimal totalCalculado = BigDecimal.ZERO;

        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            for (Deta_PediDTO dDto : dto.getDetalles()) {
                Flor flor = florRepository.findByIdWithDetails(dDto.getIdFlor())
                        .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + dDto.getIdFlor()));

                if (dDto.getCantidad() == null || dDto.getCantidad() <= 0) {
                    throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
                }

                // Validar stock disponible
                if (flor.getStock() < dDto.getCantidad()) {
                    throw new IllegalArgumentException("Stock insuficiente para la flor (" + obtenerNombreFlor(flor)
                            + "). Stock actual: " + flor.getStock() + ", solicitado: " + dDto.getCantidad());
                }

                // Descontar stock de la flor
                flor.setStock(flor.getStock() - dDto.getCantidad());
                florRepository.save(flor);

                // Registrar salida por venta en movimiento_inventario
                Movimiento_Inventario mov = new Movimiento_Inventario();
                mov.setIdFlor(dDto.getIdFlor());
                mov.setTipoMovimiento("SALIDA");
                mov.setCantidad(dDto.getCantidad());
                mov.setMotivo("VENTA");
                mov.setFecha(LocalDateTime.now());
                movInvRepository.save(mov);

                BigDecimal precio = dDto.getPrecio() != null ? dDto.getPrecio() : flor.getPrecio();
                BigDecimal subtotal = precio.multiply(BigDecimal.valueOf(dDto.getCantidad()));
                totalCalculado = totalCalculado.add(subtotal);

                Detalle_Pedido detalle = new Detalle_Pedido();
                detalle.setIdPedido(guardado.getIdPedido());
                detalle.setIdFlor(dDto.getIdFlor());
                detalle.setCantidad(dDto.getCantidad());
                detalle.setPrecio(precio);
                detalle.setSubtotal(subtotal);

                Detalle_Pedido detGuardado = detaPediRepository.save(detalle);
                detallesGuardados.add(new Deta_PediDTO(
                        detGuardado.getIdDetallePedido(),
                        guardado.getIdPedido(),
                        detGuardado.getIdFlor(),
                        obtenerNombreFlor(flor),
                        detGuardado.getCantidad(),
                        detGuardado.getPrecio(),
                        detGuardado.getSubtotal()
                ));
            }
            guardado.setTotal(totalCalculado);
            guardado = pedidoRepository.save(guardado);
        } else if (dto.getTotal() != null) {
            guardado.setTotal(dto.getTotal());
            guardado = pedidoRepository.save(guardado);
        }

        return toDto(guardado, cliente.getNombre(), empleado != null ? empleado.getNombre() : null, detallesGuardados);
    }

    // Listar todos los pedidos
    public List<PedidoDTO> findAll() {
        return pedidoRepository.findAllWithPersonas()
                .stream()
                .map(this::toDtoWithDetalles)
                .collect(Collectors.toList());
    }

    // Buscar pedido por id con sus detalles
    public Optional<PedidoDTO> findById(Integer id) {
        return pedidoRepository.findByIdWithPersonas(id)
                .map(this::toDtoWithDetalles);
    }

    @Transactional
    public PedidoDTO updateEstado(Integer id, String estado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));
        PedidoDTO cambio = new PedidoDTO();
        cambio.setIdCliente(pedido.getIdCliente());
        cambio.setIdEmpleado(pedido.getIdEmpleado());
        cambio.setEstado(estado);
        // Reutiliza la cancelación/reactivación y sus ajustes de stock.
        return update(id, cambio);
    }

    // Actualizar pedido (incluyendo cambio de estado y reajuste de stock si se cancela)
    @Transactional
    public PedidoDTO update(Integer id, PedidoDTO dto) {
        Pedido pedido = pedidoRepository.findByIdWithPersonas(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + id));

        Persona cliente = personaRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + dto.getIdCliente()));

        Persona empleado = null;
        if (dto.getIdEmpleado() != null) {
            empleado = personaRepository.findById(dto.getIdEmpleado())
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + dto.getIdEmpleado()));
        }

        String nuevoEstado = dto.getEstado() != null ? dto.getEstado().trim().toUpperCase() : pedido.getEstado();
        if (!ESTADOS_VALIDOS.contains(nuevoEstado)) {
            throw new IllegalArgumentException("Estado inválido: " + dto.getEstado());
        }

        // Si el estado cambia a CANCELADO, revertir el stock de las flores
        if ("CANCELADO".equals(nuevoEstado) && !"CANCELADO".equals(pedido.getEstado())) {
            List<Detalle_Pedido> detalles = detaPediRepository.findByIdPedido(id);
            for (Detalle_Pedido d : detalles) {
                Flor flor = florRepository.findById(d.getIdFlor()).orElse(null);
                if (flor != null) {
                    flor.setStock(flor.getStock() + d.getCantidad());
                    florRepository.save(flor);

                    // Registrar movimiento de compensación/devolución por cancelación
                    Movimiento_Inventario mov = new Movimiento_Inventario();
                    mov.setIdFlor(d.getIdFlor());
                    mov.setTipoMovimiento("ENTRADA");
                    mov.setCantidad(d.getCantidad());
                    mov.setMotivo("VENTA"); // Reingreso por venta cancelada
                    mov.setFecha(LocalDateTime.now());
                    movInvRepository.save(mov);
                }
            }
        } else if (!"CANCELADO".equals(nuevoEstado) && "CANCELADO".equals(pedido.getEstado())) {
            // Si se reactiva un pedido cancelado, validar y volver a descontar stock
            List<Detalle_Pedido> detalles = detaPediRepository.findByIdPedido(id);
            for (Detalle_Pedido d : detalles) {
                Flor flor = florRepository.findById(d.getIdFlor())
                        .orElseThrow(() -> new RuntimeException("Flor no encontrada"));
                if (flor.getStock() < d.getCantidad()) {
                    throw new IllegalArgumentException("No se puede reactivar el pedido. Stock insuficiente para flor id: " + flor.getIdFlor());
                }
                flor.setStock(flor.getStock() - d.getCantidad());
                florRepository.save(flor);

                Movimiento_Inventario mov = new Movimiento_Inventario();
                mov.setIdFlor(d.getIdFlor());
                mov.setTipoMovimiento("SALIDA");
                mov.setCantidad(d.getCantidad());
                mov.setMotivo("VENTA");
                mov.setFecha(LocalDateTime.now());
                movInvRepository.save(mov);
            }
        }

        pedido.setIdCliente(dto.getIdCliente());
        pedido.setIdEmpleado(dto.getIdEmpleado());
        pedido.setEstado(nuevoEstado);
        if (dto.getFecha() != null) {
            pedido.setFecha(dto.getFecha());
        }
        if (dto.getTotal() != null) {
            pedido.setTotal(dto.getTotal());
        }

        Pedido actualizado = pedidoRepository.save(pedido);
        return toDtoWithDetalles(actualizado);
    }

    // Una sola transacción: los detalles, el stock, los movimientos y la cabecera
    // se confirman juntos. Cualquier fallo revierte todas las escrituras.
    @Transactional(rollbackFor = Exception.class)
    public PedidoDTO updateCompleto(Integer id, UpdatePedidoCompletoDTO dto) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));
        Persona cliente = personaRepository.findById(dto.idCliente())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        Persona empleado = dto.idEmpleado() == null ? null : personaRepository.findById(dto.idEmpleado())
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
        String estado = dto.estado() == null ? "" : dto.estado().trim().toUpperCase(Locale.ROOT);
        if (!ESTADOS_VALIDOS.contains(estado)) throw new IllegalArgumentException("Estado inválido");
        if (dto.detalles() == null || dto.detalles().isEmpty())
            throw new IllegalArgumentException("El pedido debe tener al menos una flor");

        List<Detalle_Pedido> originales = detaPediRepository.findByIdPedido(id);
        Map<Integer, Detalle_Pedido> porId = originales.stream().collect(
                Collectors.toMap(Detalle_Pedido::getIdDetallePedido, d -> d));
        Map<Integer, Integer> diferencias = new HashMap<>();
        if (!"CANCELADO".equals(pedido.getEstado())) {
            for (Detalle_Pedido d : originales)
                diferencias.merge(d.getIdFlor(), d.getCantidad(), Math::addExact);
        }
        Set<Integer> ids = new HashSet<>();
        Set<Integer> flores = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (UpdatePedidoCompletoDTO.Item d : dto.detalles()) {
            if (d == null || d.idFlor() == null || d.cantidad() == null || d.cantidad() <= 0
                    || d.precio() == null || d.precio().signum() < 0)
                throw new IllegalArgumentException("Detalle inválido: revisa flor, cantidad y precio");
            if (!flores.add(d.idFlor())) throw new IllegalArgumentException("No repitas flores en el pedido");
            if (d.idDetallePedido() != null && (!porId.containsKey(d.idDetallePedido())
                    || !ids.add(d.idDetallePedido())))
                throw new IllegalArgumentException("El detalle no pertenece al pedido o está repetido");
            diferencias.putIfAbsent(d.idFlor(), 0);
            if (!"CANCELADO".equals(estado))
                diferencias.merge(d.idFlor(), -d.cantidad(), Math::addExact);
            total = total.add(d.precio().multiply(BigDecimal.valueOf(d.cantidad())));
        }

        // Validar todas las existencias antes de empezar a escribir.
        Map<Integer, Flor> catalogo = new HashMap<>();
        Map<Integer, Integer> stocks = new HashMap<>();
        for (Integer idFlor : diferencias.keySet().stream().sorted().toList()) {
            Flor flor = florRepository.findByIdWithDetails(idFlor)
                    .orElseThrow(() -> new IllegalArgumentException("Flor no encontrada: " + idFlor));
            int stock = Math.addExact(flor.getStock(), diferencias.get(idFlor));
            if (stock < 0) throw new IllegalArgumentException("Stock insuficiente para " + obtenerNombreFlor(flor));
            catalogo.put(idFlor, flor);
            stocks.put(idFlor, stock);
        }
        for (Integer idFlor : diferencias.keySet().stream().sorted().toList()) {
            int diferencia = diferencias.get(idFlor);
            if (diferencia == 0) continue;
            Flor flor = catalogo.get(idFlor);
            flor.setStock(stocks.get(idFlor));
            florRepository.save(flor);
            Movimiento_Inventario movimiento = new Movimiento_Inventario();
            movimiento.setIdFlor(idFlor);
            movimiento.setCantidad(Math.abs(diferencia));
            movimiento.setTipoMovimiento(diferencia > 0 ? "ENTRADA" : "SALIDA");
            movimiento.setMotivo("VENTA");
            movimiento.setFecha(LocalDateTime.now());
            movInvRepository.save(movimiento);
        }
        for (Detalle_Pedido original : originales) {
            if (!ids.contains(original.getIdDetallePedido())) detaPediRepository.delete(original);
        }
        List<Deta_PediDTO> guardados = new ArrayList<>();
        for (UpdatePedidoCompletoDTO.Item d : dto.detalles()) {
            Detalle_Pedido detalle = d.idDetallePedido() == null ? new Detalle_Pedido() : porId.get(d.idDetallePedido());
            detalle.setIdPedido(id);
            detalle.setIdFlor(d.idFlor());
            detalle.setCantidad(d.cantidad());
            detalle.setPrecio(d.precio());
            detalle.setSubtotal(d.precio().multiply(BigDecimal.valueOf(d.cantidad())));
            detalle = detaPediRepository.save(detalle);
            guardados.add(new Deta_PediDTO(detalle.getIdDetallePedido(), id, d.idFlor(),
                    obtenerNombreFlor(catalogo.get(d.idFlor())), d.cantidad(), d.precio(), detalle.getSubtotal()));
        }
        pedido.setIdCliente(dto.idCliente());
        pedido.setIdEmpleado(dto.idEmpleado());
        pedido.setEstado(estado);
        pedido.setTotal(total);
        pedidoRepository.save(pedido);
        return toDto(pedido, cliente.getNombre(), empleado == null ? null : empleado.getNombre(), guardados);
    }

    // Eliminar pedido por id
    @Transactional
    public void deleteById(Integer id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + id));

        // Si el pedido no estaba cancelado, reponer el stock
        if (!"CANCELADO".equals(pedido.getEstado())) {
            List<Detalle_Pedido> detalles = detaPediRepository.findByIdPedido(id);
            for (Detalle_Pedido d : detalles) {
                Flor flor = florRepository.findById(d.getIdFlor()).orElse(null);
                if (flor != null) {
                    flor.setStock(flor.getStock() + d.getCantidad());
                    florRepository.save(flor);
                }
            }
        }

        pedidoRepository.deleteById(id);
    }

    // Recalcular total del pedido
    @Transactional
    public void recalcularTotal(Integer idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + idPedido));

        List<Detalle_Pedido> detalles = detaPediRepository.findByIdPedido(idPedido);
        BigDecimal nuevoTotal = detalles.stream()
                .map(Detalle_Pedido::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        pedido.setTotal(nuevoTotal);
        pedidoRepository.save(pedido);
    }

    private String obtenerNombreFlor(Flor flor) {
        if (flor == null) return null;
        String tipo = flor.getTipoFlor() != null ? flor.getTipoFlor().getNombre() : "";
        String color = flor.getColor() != null ? flor.getColor().getNombre() : "";
        return (tipo + " " + color).trim();
    }

    private PedidoDTO toDto(Pedido p) {
        String clienteNombre = p.getCliente() != null ? p.getCliente().getNombre() : null;
        String empleadoNombre = p.getEmpleado() != null ? p.getEmpleado().getNombre() : null;
        return toDto(p, clienteNombre, empleadoNombre, null);
    }

    private PedidoDTO toDto(Pedido p, String clienteNombre, String empleadoNombre, List<Deta_PediDTO> detalles) {
        return new PedidoDTO(
                p.getIdPedido(),
                p.getIdCliente(),
                clienteNombre,
                p.getIdEmpleado(),
                empleadoNombre,
                p.getEstado(),
                p.getFecha(),
                p.getTotal(),
                detalles
        );
    }

    private PedidoDTO toDtoWithDetalles(Pedido p) {
        String clienteNombre = p.getCliente() != null ? p.getCliente().getNombre() : null;
        String empleadoNombre = p.getEmpleado() != null ? p.getEmpleado().getNombre() : null;

        List<Deta_PediDTO> detallesDTO = detaPediRepository.findByIdPedidoWithFlor(p.getIdPedido())
                .stream()
                .map(d -> new Deta_PediDTO(
                        d.getIdDetallePedido(),
                        d.getIdPedido(),
                        d.getIdFlor(),
                        obtenerNombreFlor(d.getFlor()),
                        d.getCantidad(),
                        d.getPrecio(),
                        d.getSubtotal()
                ))
                .collect(Collectors.toList());

        return toDto(p, clienteNombre, empleadoNombre, detallesDTO);
    }
}
