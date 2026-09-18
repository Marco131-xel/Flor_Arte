package com.florarte.backend.controllers;

import com.florarte.backend.dtos.Entrada_InventarioDTO;
import com.florarte.backend.services.Entra_InvService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/entrada_inventario")
public class Entra_InvController {

    private final Entra_InvService entraInvService;

    @Autowired
    public Entra_InvController(Entra_InvService entraInvService) {
        this.entraInvService = entraInvService;
    }

    // Obtener todas las entradas
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(entraInvService.findAll());
    }

    // Obtener una entrada por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        Entrada_InventarioDTO entrada = entraInvService.findById(id)
                .orElseThrow(() -> new RuntimeException("Entrada de inventario no encontrada con id: " + id));
        return ResponseEntity.ok(entrada);
    }

    // Crear entrada de inventario
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> create(@Valid @RequestBody Entrada_InventarioDTO dto) {
        Entrada_InventarioDTO nueva = entraInvService.save(dto);
        return ResponseEntity.ok(Map.of("message", "Entrada de inventario creada exitosamente", "entrada", nueva));
    }

    // crear entrada de inventario con detalles
    // Crear entrada de inventario con detalles
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create-completa")
    public ResponseEntity<?> createCompleta(@Valid @RequestBody Entrada_InventarioDTO dto) {
        Entrada_InventarioDTO nueva = entraInvService.saveConDetalles(dto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Entrada de inventario y sus detalles creados exitosamente",
                        "entrada", nueva
                ));
    }

    // Actualizar entrada de inventario
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody Entrada_InventarioDTO dto) {
        Entrada_InventarioDTO actualizada = entraInvService.update(id, dto);
        return ResponseEntity.ok(Map.of("message", "Entrada de inventario actualizada exitosamente", "entrada", actualizada));
    }

    // Eliminar entrada de inventario
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        entraInvService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Entrada de inventario eliminada exitosamente"));
    }
}
