package com.florarte.backend.controllers;

import com.florarte.backend.dtos.Movimiento_InventarioDTO;
import com.florarte.backend.services.Mov_InvService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/movimiento_inventario")
public class Mov_InvController {

    private final Mov_InvService movInvService;

    @Autowired
    public Mov_InvController(Mov_InvService movInvService) {
        this.movInvService = movInvService;
    }

    // Obtener todos los movimientos
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(movInvService.findAll());
    }

    // Obtener un movimiento por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        Movimiento_InventarioDTO mov = movInvService.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento de inventario no encontrado con id: " + id));
        return ResponseEntity.ok(mov);
    }

    // Obtener historial de movimientos por flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/flor/{idFlor}")
    public ResponseEntity<?> getByFlor(@PathVariable Integer idFlor) {
        return ResponseEntity.ok(movInvService.findByFlor(idFlor));
    }

    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/costo/{idFlor}")
    public Map<String,Object> costo(@PathVariable Integer idFlor) {
        var resultado=new java.util.HashMap<String,Object>();
        resultado.put("costoUnitario",movInvService.costoReferencia(idFlor,java.time.LocalDateTime.now(java.time.ZoneId.of("America/Guatemala"))));
        return resultado;
    }

    // Crear un movimiento de inventario
    @PreAuthorize("hasRole('ADMINISTRADOR') or (hasRole('EMPLEADO') and #dto.motivo == 'MERMA' and #dto.tipoMovimiento == 'SALIDA')")
    @PostMapping("/create")
    public ResponseEntity<?> create(@Valid @RequestBody Movimiento_InventarioDTO dto) {
        Movimiento_InventarioDTO nuevo = movInvService.save(dto);
        return ResponseEntity.ok(Map.of("message", "Movimiento de inventario registrado exitosamente", "movimiento", nuevo));
    }

    // Actualizar un movimiento de inventario
    @PreAuthorize("@reglasEdicion.merma(#id, #dto.motivo, #dto.tipoMovimiento)")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody Movimiento_InventarioDTO dto) {
        Movimiento_InventarioDTO actualizado = movInvService.update(id, dto);
        return ResponseEntity.ok(Map.of("message", "Movimiento de inventario actualizado exitosamente", "movimiento", actualizado));
    }

    // Eliminar un movimiento de inventario
    @PreAuthorize("@reglasEdicion.merma(#id, 'MERMA', 'SALIDA')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        movInvService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Movimiento de inventario eliminado exitosamente"));
    }
}
