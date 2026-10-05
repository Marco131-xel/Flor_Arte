package com.florarte.backend.services;

import com.florarte.backend.dtos.Movimiento_InventarioDTO;
import com.florarte.backend.entities.Flor;
import com.florarte.backend.entities.Movimiento_Inventario;
import com.florarte.backend.repositories.FlorRepository;
import com.florarte.backend.repositories.Mov_InvRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class Mov_InvService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("ENTRADA", "SALIDA");
    private static final Set<String> MOTIVOS_PERMITIDOS = Set.of("ENTRADA", "VENTA", "ARREGLO", "MERMA");

    private final Mov_InvRepository movInvRepository;
    private final FlorRepository florRepository;

    @Autowired
    public Mov_InvService(Mov_InvRepository movInvRepository, FlorRepository florRepository) {
        this.movInvRepository = movInvRepository;
        this.florRepository = florRepository;
    }

    // Crear un movimiento de inventario
    @Transactional
    public Movimiento_InventarioDTO save(Movimiento_InventarioDTO dto) {
        Flor flor = florRepository.findByIdWithDetails(dto.getIdFlor())
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + dto.getIdFlor()));

        String tipo = dto.getTipoMovimiento() != null ? dto.getTipoMovimiento().trim().toUpperCase() : "";
        if (!TIPOS_PERMITIDOS.contains(tipo)) {
            throw new IllegalArgumentException("Tipo de movimiento inválido: " + dto.getTipoMovimiento() + ". Permitidos: ENTRADA, SALIDA");
        }

        String motivo = dto.getMotivo() != null ? dto.getMotivo().trim().toUpperCase() : "";
        if (!MOTIVOS_PERMITIDOS.contains(motivo)) {
            throw new IllegalArgumentException("Motivo inválido: " + dto.getMotivo() + ". Permitidos: ENTRADA, VENTA, ARREGLO, MERMA");
        }

        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        // Ajustar stock según el tipo de movimiento
        if ("SALIDA".equals(tipo)) {
            if (flor.getStock() < dto.getCantidad()) {
                throw new IllegalArgumentException("Stock insuficiente para realizar la salida. Stock disponible: " + flor.getStock());
            }
            flor.setStock(flor.getStock() - dto.getCantidad());
        } else {
            flor.setStock(flor.getStock() + dto.getCantidad());
        }
        florRepository.save(flor);

        Movimiento_Inventario mov = new Movimiento_Inventario();
        mov.setIdFlor(dto.getIdFlor());
        mov.setTipoMovimiento(tipo);
        mov.setCantidad(dto.getCantidad());
        mov.setMotivo(motivo);
        mov.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDateTime.now());

        Movimiento_Inventario guardado = movInvRepository.save(mov);
        return toDto(guardado, obtenerNombreFlor(flor));
    }

    // Listar todos los movimientos
    public List<Movimiento_InventarioDTO> findAll() {
        return movInvRepository.findAllWithFlor()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Buscar movimiento por id
    public Optional<Movimiento_InventarioDTO> findById(Integer id) {
        return movInvRepository.findByIdWithFlor(id).map(this::toDto);
    }

    // Buscar movimientos por flor
    public List<Movimiento_InventarioDTO> findByFlor(Integer idFlor) {
        return movInvRepository.findByIdFlorWithFlor(idFlor)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Actualizar movimiento
    @Transactional
    public Movimiento_InventarioDTO update(Integer id, Movimiento_InventarioDTO dto) {
        Movimiento_Inventario mov = movInvRepository.findByIdWithFlor(id)
                .orElseThrow(() -> new RuntimeException("Movimiento de inventario no encontrado con id: " + id));

        Flor flor = florRepository.findByIdWithDetails(dto.getIdFlor())
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + dto.getIdFlor()));

        String tipo = dto.getTipoMovimiento() != null ? dto.getTipoMovimiento().trim().toUpperCase() : "";
        if (!TIPOS_PERMITIDOS.contains(tipo)) {
            throw new IllegalArgumentException("Tipo de movimiento inválido. Permitidos: ENTRADA, SALIDA");
        }

        String motivo = dto.getMotivo() != null ? dto.getMotivo().trim().toUpperCase() : "";
        if (!MOTIVOS_PERMITIDOS.contains(motivo)) {
            throw new IllegalArgumentException("Motivo inválido. Permitidos: ENTRADA, VENTA, ARREGLO, MERMA");
        }

        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        // Revertir el efecto anterior antes de aplicar la cantidad corregida.
        Flor anterior = mov.getIdFlor().equals(dto.getIdFlor()) ? flor : florRepository.findByIdWithDetails(mov.getIdFlor())
                .orElseThrow(() -> new IllegalArgumentException("Flor original no encontrada"));
        int efectoAnterior = "ENTRADA".equals(mov.getTipoMovimiento()) ? mov.getCantidad() : -mov.getCantidad();
        int efectoNuevo = "ENTRADA".equals(tipo) ? dto.getCantidad() : -dto.getCantidad();
        int stockAnterior = anterior.getStock() - efectoAnterior;
        int stockNuevo = (anterior == flor ? stockAnterior : flor.getStock()) + efectoNuevo;
        if (stockNuevo < 0 || (anterior != flor && stockAnterior < 0)) {
            throw new IllegalArgumentException("Stock insuficiente para corregir el movimiento");
        }
        if (anterior != flor) { anterior.setStock(stockAnterior); florRepository.save(anterior); }
        flor.setStock(stockNuevo);
        florRepository.save(flor);

        mov.setIdFlor(dto.getIdFlor());
        mov.setTipoMovimiento(tipo);
        mov.setCantidad(dto.getCantidad());
        mov.setMotivo(motivo);
        if (dto.getFecha() != null) {
            mov.setFecha(dto.getFecha());
        }

        Movimiento_Inventario actualizado = movInvRepository.save(mov);
        return toDto(actualizado, obtenerNombreFlor(flor));
    }

    // Eliminar movimiento
    @Transactional
    public void deleteById(Integer id) {
        Movimiento_Inventario mov = movInvRepository.findByIdWithFlor(id)
                .orElseThrow(() -> new IllegalArgumentException("Movimiento no encontrado"));
        if (!"MERMA".equals(mov.getMotivo()) || !"SALIDA".equals(mov.getTipoMovimiento())) {
            throw new IllegalArgumentException("Solo se pueden eliminar mermas desde este módulo");
        }
        Flor flor = florRepository.findByIdWithDetails(mov.getIdFlor())
                .orElseThrow(() -> new IllegalArgumentException("Flor no encontrada"));
        flor.setStock(flor.getStock() + mov.getCantidad());
        florRepository.save(flor);
        movInvRepository.deleteById(id);
    }

    private String obtenerNombreFlor(Flor flor) {
        if (flor == null) return null;
        String tipo = flor.getTipoFlor() != null ? flor.getTipoFlor().getNombre() : "";
        String color = flor.getColor() != null ? flor.getColor().getNombre() : "";
        return (tipo + " " + color).trim();
    }

    private Movimiento_InventarioDTO toDto(Movimiento_Inventario m) {
        return toDto(m, obtenerNombreFlor(m.getFlor()));
    }

    private Movimiento_InventarioDTO toDto(Movimiento_Inventario m, String nombreFlor) {
        return new Movimiento_InventarioDTO(
                m.getIdMovimientoInventario(),
                m.getIdFlor(),
                nombreFlor,
                m.getTipoMovimiento(),
                m.getCantidad(),
                m.getMotivo(),
                m.getFecha()
        );
    }
}
