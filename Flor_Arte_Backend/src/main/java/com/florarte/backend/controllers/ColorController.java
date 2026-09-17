package com.florarte.backend.controllers;

import com.florarte.backend.dtos.ColorDTO;
import com.florarte.backend.services.ColorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/color")
public class ColorController {

    private final ColorService colorService;

    @Autowired
    public ColorController(ColorService colorService) {
        this.colorService = colorService;
    }

    // Obtener todos los colores
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllColors() {
        return ResponseEntity.ok(colorService.findAll());
    }

    // Obtener un color por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getColorById(@PathVariable Integer id) {
        ColorDTO color = colorService.findById(id)
                .orElseThrow(() -> new RuntimeException("Color no encontrado con id: " + id));
        return ResponseEntity.ok(color);
    }

    // Crear un color
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> createColor(@Valid @RequestBody ColorDTO colorDto) {
        ColorDTO nuevo = colorService.save(colorDto);
        return ResponseEntity.ok(Map.of("message", "Color creado exitosamente", "color", nuevo));
    }

    // Actualizar un color
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> updateColor(@PathVariable Integer id, @Valid @RequestBody ColorDTO colorDto) {
        ColorDTO actualizado = colorService.update(id, colorDto);
        return ResponseEntity.ok(Map.of("message", "Color actualizado exitosamente", "color", actualizado));
    }

    // Eliminar un color
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> deleteColor(@PathVariable Integer id) {
        colorService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Color eliminado exitosamente"));
    }
}
