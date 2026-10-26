package com.florarte.backend.services;

import com.florarte.backend.dtos.Detalle_EntradaDTO;
import com.florarte.backend.entities.Detalle_Entrada;
import com.florarte.backend.entities.Flor;
import com.florarte.backend.entities.Movimiento_Inventario;
import com.florarte.backend.repositories.Deta_EntraRepository;
import com.florarte.backend.repositories.Entra_InvRepository;
import com.florarte.backend.repositories.FlorRepository;
import com.florarte.backend.repositories.Mov_InvRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class Deta_EntraService {

    private final Deta_EntraRepository detaEntraRepository;
    private final Entra_InvRepository entraInvRepository;
    private final FlorRepository florRepository;
    private final Mov_InvRepository movInvRepository;

    @Autowired
    public Deta_EntraService(Deta_EntraRepository detaEntraRepository,
                             Entra_InvRepository entraInvRepository,
                             FlorRepository florRepository,
                             Mov_InvRepository movInvRepository) {
        this.detaEntraRepository = detaEntraRepository;
        this.entraInvRepository = entraInvRepository;
        this.florRepository = florRepository;
        this.movInvRepository = movInvRepository;
    }

    @Transactional
    public Detalle_EntradaDTO save(Detalle_EntradaDTO dto) {
        Detalle_EntradaDTO guardado = saveSinRecalcular(dto);
        actualizarTotalEntrada(dto.getIdEntrada());
        return guardado;
    }

    // Crear un detalle de entrada
    @Transactional
    public Detalle_EntradaDTO saveSinRecalcular(Detalle_EntradaDTO dto) {
        if (!entraInvRepository.existsById(dto.getIdEntrada())) {
            throw new RuntimeException("Entrada de inventario no encontrada con id: " + dto.getIdEntrada());
        }

        Flor flor = florRepository.findByIdWithDetails(dto.getIdFlor())
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + dto.getIdFlor()));

        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        if (dto.getPrecioCompra() == null || dto.getPrecioCompra().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio de compra no puede ser negativo");
        }

        BigDecimal subtotal = dto.getPrecioCompra().multiply(BigDecimal.valueOf(dto.getCantidad()));

        Detalle_Entrada detalle = new Detalle_Entrada();
        detalle.setIdEntrada(dto.getIdEntrada());
        detalle.setIdFlor(dto.getIdFlor());
        detalle.setCantidad(dto.getCantidad());
        detalle.setPrecioCompra(dto.getPrecioCompra());
        detalle.setSubtotal(subtotal);

        Detalle_Entrada guardado = detaEntraRepository.save(detalle);

        // Aumentar el stock de la flor
        flor.setStock(flor.getStock() + dto.getCantidad());
        florRepository.save(flor);

        // Registrar movimiento de inventario de tipo ENTRADA
        Movimiento_Inventario mov = new Movimiento_Inventario();
        mov.setIdFlor(dto.getIdFlor());
        mov.setTipoMovimiento("ENTRADA");
        mov.setCantidad(dto.getCantidad());
        mov.setMotivo("ENTRADA");
        mov.setFecha(LocalDateTime.now());
        movInvRepository.save(mov);

        // Actualizar total en la entrada de inventario
        //actualizarTotalEntrada(dto.getIdEntrada());

        return toDto(guardado, obtenerNombreFlor(flor));
    }

    // Listar todos los detalles
    public List<Detalle_EntradaDTO> findAll() {
        return detaEntraRepository.findAllWithFlor()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Buscar detalle por id
    public Optional<Detalle_EntradaDTO> findById(Integer id) {
        return detaEntraRepository.findByIdWithFlor(id).map(this::toDto);
    }

    // Buscar detalles por id de entrada
    public List<Detalle_EntradaDTO> findByEntrada(Integer idEntrada) {
        return detaEntraRepository.findByIdEntradaWithFlor(idEntrada)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Actualizar detalle de entrada
    @Transactional
    public Detalle_EntradaDTO update(Integer id, Detalle_EntradaDTO dto) {
        Detalle_Entrada detalle = detaEntraRepository.findByIdWithFlor(id)
                .orElseThrow(() -> new RuntimeException("Detalle de entrada no encontrado con id: " + id));

        Flor flor = florRepository.findByIdWithDetails(dto.getIdFlor())
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + dto.getIdFlor()));

        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        if (dto.getPrecioCompra() == null || dto.getPrecioCompra().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio de compra no puede ser negativo");
        }

        // Ajuste de stock si cambió la cantidad o la flor
        int diffCantidad = dto.getCantidad() - detalle.getCantidad();
        if (detalle.getIdFlor().equals(dto.getIdFlor())) {
            flor.setStock(flor.getStock() + diffCantidad);
            if (flor.getStock() < 0) {
                throw new IllegalArgumentException("No se puede actualizar: el stock resultante sería negativo");
            }
            florRepository.save(flor);
        } else {
            // Se cambió de flor: devolver stock a la anterior y sumar a la nueva
            Flor florAnterior = florRepository.findById(detalle.getIdFlor())
                    .orElseThrow(() -> new RuntimeException("Flor anterior no encontrada"));
            florAnterior.setStock(florAnterior.getStock() - detalle.getCantidad());
            florRepository.save(florAnterior);

            flor.setStock(flor.getStock() + dto.getCantidad());
            florRepository.save(flor);
        }

        BigDecimal subtotal = dto.getPrecioCompra().multiply(BigDecimal.valueOf(dto.getCantidad()));

        detalle.setIdFlor(dto.getIdFlor());
        detalle.setCantidad(dto.getCantidad());
        detalle.setPrecioCompra(dto.getPrecioCompra());
        detalle.setSubtotal(subtotal);

        Detalle_Entrada actualizado = detaEntraRepository.save(detalle);

        actualizarTotalEntrada(detalle.getIdEntrada());

        return toDto(actualizado, obtenerNombreFlor(flor));
    }

    // Eliminar detalle de entrada
    @Transactional
    public void deleteById(Integer id) {
        Detalle_Entrada detalle = detaEntraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Detalle de entrada no encontrado con id: " + id));

        // Revertir el stock en la flor
        Flor flor = florRepository.findById(detalle.getIdFlor()).orElse(null);
        if (flor != null) {
            flor.setStock(Math.max(0, flor.getStock() - detalle.getCantidad()));
            florRepository.save(flor);
        }

        Integer idEntrada = detalle.getIdEntrada();
        detaEntraRepository.deleteById(id);

        actualizarTotalEntrada(idEntrada);
    }

    private void actualizarTotalEntrada(Integer idEntrada) {
        List<Detalle_Entrada> detalles = detaEntraRepository.findByIdEntrada(idEntrada);
        BigDecimal total = detalles.stream()
                .map(Detalle_Entrada::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        entraInvRepository.findById(idEntrada).ifPresent(e -> {
            e.setTotal(total);
            entraInvRepository.save(e);
        });
    }

    private String obtenerNombreFlor(Flor flor) {
        if (flor == null) return null;
        String tipo = flor.getTipoFlor() != null ? flor.getTipoFlor().getNombre() : "";
        String color = flor.getColor() != null ? flor.getColor().getNombre() : "";
        return (tipo + " " + color).trim();
    }

    private Detalle_EntradaDTO toDto(Detalle_Entrada d) {
        return toDto(d, obtenerNombreFlor(d.getFlor()));
    }

    private Detalle_EntradaDTO toDto(Detalle_Entrada d, String nombreFlor) {
        return new Detalle_EntradaDTO(
                d.getIdDetalleEntrada(),
                d.getIdEntrada(),
                d.getIdFlor(),
                nombreFlor,
                d.getCantidad(),
                d.getPrecioCompra(),
                d.getSubtotal()
        );
    }
}
