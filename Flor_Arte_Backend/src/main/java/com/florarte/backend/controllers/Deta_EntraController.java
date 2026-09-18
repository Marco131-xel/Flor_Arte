package com.florarte.backend.controllers;

import com.florarte.backend.dtos.Detalle_EntradaDTO;
import com.florarte.backend.services.Deta_EntraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/detalle_entrada")
public class Deta_EntraController {

    private final Deta_EntraService detaEntraService;

    @Autowired
    public Deta_EntraController(Deta_EntraService detaEntraService) {
        this.detaEntraService = detaEntraService;
    }

    // Obtener todos los detalles
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(detaEntraService.findAll());
    }

    // Obtener un detalle por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        Detalle_EntradaDTO detalle = detaEntraService.findById(id)
                .orElseThrow(() -> new RuntimeException("Detalle de entrada no encontrado con id: " + id));
        return ResponseEntity.ok(detalle);
    }

    // Obtener detalles por id de entrada
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/entrada/{idEntrada}")
    public ResponseEntity<?> getByEntrada(@PathVariable Integer idEntrada) {
        return ResponseEntity.ok(detaEntraService.findByEntrada(idEntrada));
    }

    // Crear un detalle de entrada
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> create(@Valid @RequestBody Detalle_EntradaDTO dto) {
        Detalle_EntradaDTO nuevo = detaEntraService.save(dto);
        return ResponseEntity.ok(Map.of("message", "Detalle de entrada creado exitosamente", "detalle", nuevo));
    }

    // Actualizar un detalle de entrada
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody Detalle_EntradaDTO dto) {
        Detalle_EntradaDTO actualizado = detaEntraService.update(id, dto);
        return ResponseEntity.ok(Map.of("message", "Detalle de entrada actualizado exitosamente", "detalle", actualizado));
    }

    // Eliminar un detalle de entrada
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        detaEntraService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Detalle de entrada eliminado exitosamente"));
    }
}
