package com.florarte.backend.controllers;

import com.florarte.backend.dtos.TipoFlorDTO;
import com.florarte.backend.services.TipoFlorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/tipoflor")
public class TipoFlorController {

    private final TipoFlorService tipoFlorService;

    @Autowired
    public TipoFlorController(TipoFlorService tipoFlorService) {
        this.tipoFlorService = tipoFlorService;
    }

    // Obtener todos los tipos de flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllTiposFlor() {
        return ResponseEntity.ok(tipoFlorService.findAll());
    }

    // Obtener un tipo de flor por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getTipoFlorById(@PathVariable Integer id) {
        TipoFlorDTO tipoFlor = tipoFlorService.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de flor no encontrado con id: " + id));
        return ResponseEntity.ok(tipoFlor);
    }

    // Crear un tipo de flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> createTipoFlor(@Valid @RequestBody TipoFlorDTO dto) {
        TipoFlorDTO nuevo = tipoFlorService.save(dto);
        return ResponseEntity.ok(Map.of("message", "Tipo de flor creado exitosamente", "tipoFlor", nuevo));
    }

    // Actualizar un tipo de flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> updateTipoFlor(@PathVariable Integer id, @Valid @RequestBody TipoFlorDTO dto) {
        TipoFlorDTO actualizado = tipoFlorService.update(id, dto);
        return ResponseEntity.ok(Map.of("message", "Tipo de flor actualizado exitosamente", "tipoFlor", actualizado));
    }

    // Eliminar un tipo de flor
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> deleteTipoFlor(@PathVariable Integer id) {
        tipoFlorService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Tipo de flor eliminado exitosamente"));
    }
}
