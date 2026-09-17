package com.florarte.backend.controllers;

import com.florarte.backend.dtos.FlorDTO;
import com.florarte.backend.services.FlorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/flor")
public class FlorController {

    private final FlorService florService;

    @Autowired
    public FlorController(FlorService florService) {
        this.florService = florService;
    }

    // Obtener todas las flores
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllFlores() {
        return ResponseEntity.ok(florService.findAll());
    }

    // Obtener una flor por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getFlorById(@PathVariable Integer id) {
        FlorDTO flor = florService.findById(id)
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + id));
        return ResponseEntity.ok(flor);
    }

    // Crear una flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> createFlor(@Valid @RequestBody FlorDTO florDto) {
        FlorDTO nueva = florService.save(florDto);
        return ResponseEntity.ok(Map.of("message", "Flor creada exitosamente", "flor", nueva));
    }

    // Actualizar una flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> updateFlor(@PathVariable Integer id, @Valid @RequestBody FlorDTO florDto) {
        FlorDTO actualizada = florService.update(id, florDto);
        return ResponseEntity.ok(Map.of("message", "Flor actualizada exitosamente", "flor", actualizada));
    }

    // Eliminar una flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> deleteFlor(@PathVariable Integer id) {
        florService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Flor eliminada exitosamente"));
    }
}
