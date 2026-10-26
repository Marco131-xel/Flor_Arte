package com.florarte.backend.services;

import com.florarte.backend.dtos.Detalle_EntradaDTO;
import com.florarte.backend.dtos.Entrada_InventarioDTO;
import com.florarte.backend.entities.*;
import com.florarte.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class Entra_InvService {

    private final Entra_InvRepository entraInvRepository;
    private final PersonaRepository personaRepository;
    private final Deta_EntraRepository detaEntraRepository;
    private final FlorRepository florRepository;
    private final Deta_EntraService detaEntraService;
    private final Mov_InvRepository mov_InvRepository;

    @Autowired
    public Entra_InvService(Entra_InvRepository entraInvRepository,
                            PersonaRepository personaRepository,
                            Deta_EntraRepository detaEntraRepository,
                            Deta_EntraService detaEntraService,
                            FlorRepository florRepository, Mov_InvRepository mov_InvRepository) {
        this.entraInvRepository = entraInvRepository;
        this.personaRepository = personaRepository;
        this.detaEntraRepository = detaEntraRepository;
        this.detaEntraService = detaEntraService;
        this.florRepository = florRepository;
        this.mov_InvRepository = mov_InvRepository;
    }

    // Crear entrada de inventario
    @Transactional
    public Entrada_InventarioDTO save(Entrada_InventarioDTO dto) {
        Persona persona = personaRepository.findById(dto.getIdPersona())
                .orElseThrow(() -> new RuntimeException("Persona/Proveedor no encontrado con id: " + dto.getIdPersona()));

        Entrada_Inventario entrada = new Entrada_Inventario();
        entrada.setIdPersona(dto.getIdPersona());
        entrada.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDateTime.now());
        entrada.setTotal(dto.getTotal() != null ? dto.getTotal() : BigDecimal.ZERO);

        Entrada_Inventario guardada = entraInvRepository.save(entrada);
        return toDto(guardada, persona.getNombre());
    }

    // crear entrada con detalles
    @Transactional
    public Entrada_InventarioDTO saveConDetalles(Entrada_InventarioDTO dto) {
        Persona persona = personaRepository.findById(dto.getIdPersona())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + dto.getIdPersona()));

        if (dto.getDetalles() == null || dto.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La entrada debe tener al menos un detalle");
        }

        Entrada_Inventario entrada = new Entrada_Inventario();
        entrada.setIdPersona(dto.getIdPersona());
        entrada.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDateTime.now());
        entrada.setTotal(BigDecimal.ZERO);

        Entrada_Inventario guardada = entraInvRepository.save(entrada);

        BigDecimal total = BigDecimal.ZERO;
        List<Detalle_EntradaDTO> detallesGuardados = new ArrayList<>();

        for (Detalle_EntradaDTO detalleDto : dto.getDetalles()) {
            detalleDto.setIdEntrada(guardada.getIdEntrada()); // el id lo pone el backend
            Detalle_EntradaDTO guardado = detaEntraService.saveSinRecalcular(detalleDto);
            detallesGuardados.add(guardado);
            total = total.add(guardado.getSubtotal());
        }

        guardada.setTotal(total);
        entraInvRepository.save(guardada);

        return new Entrada_InventarioDTO(
                guardada.getIdEntrada(),
                guardada.getIdPersona(),
                persona.getNombre(),
                guardada.getFecha(),
                total,
                detallesGuardados
        );
    }

    // Listar todas las entradas de inventario
    public List<Entrada_InventarioDTO> findAll() {
        return entraInvRepository.findAllWithPersona()
                .stream()
                .map(this::toDtoWithDetalles)
                .collect(Collectors.toList());
    }

    // Buscar entrada por id con sus detalles
    public Optional<Entrada_InventarioDTO> findById(Integer id) {
        return entraInvRepository.findByIdWithPersona(id)
                .map(this::toDtoWithDetalles);
    }

    // Actualizar entrada de inventario
    @Transactional
    public Entrada_InventarioDTO update(Integer id, Entrada_InventarioDTO dto) {
        Entrada_Inventario entrada = entraInvRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entrada no encontrada con id: " + id));

        Persona persona = personaRepository.findById(dto.getIdPersona())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + dto.getIdPersona()));

        if (dto.getDetalles() == null || dto.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La entrada debe tener al menos un detalle");
        }

        // 1. Revertir stock y borrar los detalles existentes
        for (Detalle_Entrada anterior : detaEntraRepository.findByIdEntrada(id)) {
            Flor flor = florRepository.findById(anterior.getIdFlor())
                    .orElseThrow(() -> new RuntimeException("Flor no encontrada: " + anterior.getIdFlor()));

            if (flor.getStock() < anterior.getCantidad()) {
                throw new IllegalStateException(
                        "No se puede editar: ya se usaron flores de esta entrada (" + flor.getStock() + " en stock)");
            }

            flor.setStock(flor.getStock() - anterior.getCantidad());
            florRepository.save(flor);
        }
        detaEntraRepository.deleteAll(detaEntraRepository.findByIdEntrada(id));

        // 2. Actualizar cabecera
        entrada.setIdPersona(dto.getIdPersona());
        entraInvRepository.save(entrada);

        // 3. Crear los nuevos detalles (aumenta stock + registra ENTRADA)
        BigDecimal total = BigDecimal.ZERO;
        List<Detalle_EntradaDTO> detallesGuardados = new ArrayList<>();

        for (Detalle_EntradaDTO detalleDto : dto.getDetalles()) {
            detalleDto.setIdEntrada(id);
            Detalle_EntradaDTO guardado = detaEntraService.saveSinRecalcular(detalleDto);
            detallesGuardados.add(guardado);
            total = total.add(guardado.getSubtotal());
        }

        entrada.setTotal(total);
        entraInvRepository.save(entrada);

        return new Entrada_InventarioDTO(
                entrada.getIdEntrada(), entrada.getIdPersona(), persona.getNombre(),
                entrada.getFecha(), total, detallesGuardados);
    }

    // Eliminar entrada de inventario
    @Transactional
    public void deleteById(Integer id) {
        Entrada_Inventario entrada = entraInvRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entrada no encontrada con id: " + id));

        for (Detalle_Entrada d: detaEntraRepository.findByIdEntrada(id)) {
            Flor flor = florRepository.findById(d.getIdFlor())
                    .orElseThrow(() -> new RuntimeException("Flor no encontrada: " + d.getIdFlor()));
            if (flor.getStock() < d.getCantidad()) {
                throw new IllegalStateException(("No se puede eliminar: ya se usaron flroes de esta entrada (" + flor.getStock() + " en stock"));
            }

            flor.setStock(flor.getStock() - d.getCantidad());
            florRepository.save(flor);

            Movimiento_Inventario mov = new Movimiento_Inventario();
            mov.setIdFlor(d.getIdFlor());
            mov.setTipoMovimiento("SALIDA");
            mov.setCantidad(d.getCantidad());
            mov.setMotivo("MERMA");
            mov_InvRepository.save(mov);
        }

        entraInvRepository.delete(entrada);
    }

    // Recalcular y actualizar el total de una entrada
    @Transactional
    public void recalcularTotal(Integer idEntrada) {
        Entrada_Inventario entrada = entraInvRepository.findById(idEntrada)
                .orElseThrow(() -> new RuntimeException("Entrada de inventario no encontrada con id: " + idEntrada));

        List<Detalle_Entrada> detalles = detaEntraRepository.findByIdEntrada(idEntrada);
        BigDecimal nuevoTotal = detalles.stream()
                .map(Detalle_Entrada::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        entrada.setTotal(nuevoTotal);
        entraInvRepository.save(entrada);
    }

    private Entrada_InventarioDTO toDto(Entrada_Inventario e) {
        String nombrePersona = e.getPersona() != null ? e.getPersona().getNombre() : null;
        return toDto(e, nombrePersona);
    }

    private Entrada_InventarioDTO toDto(Entrada_Inventario e, String nombrePersona) {
        return new Entrada_InventarioDTO(
                e.getIdEntrada(),
                e.getIdPersona(),
                nombrePersona,
                e.getFecha(),
                e.getTotal(),
                null
        );
    }

    private Entrada_InventarioDTO toDtoWithDetalles(Entrada_Inventario e) {
        String nombrePersona = e.getPersona() != null ? e.getPersona().getNombre() : null;
        List<Detalle_EntradaDTO> detallesDTO = detaEntraRepository.findByIdEntradaWithFlor(e.getIdEntrada())
                .stream()
                .map(d -> {
                    String nombreFlor = null;
                    if (d.getFlor() != null) {
                        String tipo = d.getFlor().getTipoFlor() != null ? d.getFlor().getTipoFlor().getNombre() : "";
                        String color = d.getFlor().getColor() != null ? d.getFlor().getColor().getNombre() : "";
                        nombreFlor = (tipo + " " + color).trim();
                    }
                    return new Detalle_EntradaDTO(
                            d.getIdDetalleEntrada(),
                            d.getIdEntrada(),
                            d.getIdFlor(),
                            nombreFlor,
                            d.getCantidad(),
                            d.getPrecioCompra(),
                            d.getSubtotal()
                    );
                })
                .collect(Collectors.toList());

        return new Entrada_InventarioDTO(
                e.getIdEntrada(),
                e.getIdPersona(),
                nombrePersona,
                e.getFecha(),
                e.getTotal(),
                detallesDTO
        );
    }
}
