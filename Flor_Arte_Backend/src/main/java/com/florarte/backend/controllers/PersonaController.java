package com.florarte.backend.controllers;

import com.florarte.backend.dtos.PersonaDTO;
import com.florarte.backend.services.PersonaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/persona")
public class PersonaController {

    private final PersonaService personaService;

    @Autowired
    public PersonaController(PersonaService personaService) {
        this.personaService = personaService;
    }

    // obtener todas las personas
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllPersonas() {
        return ResponseEntity.ok(personaService.findAll());
    }

    // obtener una persona por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getPersonaById(@PathVariable Long id) {
        PersonaDTO persona = personaService.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada con id: " + id));
        return ResponseEntity.ok(persona);
    }

    // crear persona
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> createPersona(@Valid @RequestBody PersonaDTO personaDto) {
        PersonaDTO nueva = personaService.save(personaDto);
        return ResponseEntity.ok(Map.of("message", "Persona creada", "persona", nueva));
    }

    // actualizar una persona
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updatePersona(@PathVariable Long id, @Valid @RequestBody PersonaDTO personaDto) {
        PersonaDTO actualizada = personaService.update(id, personaDto);
        return ResponseEntity.ok(Map.of("message", "Persona actualizada", "persona", actualizada));
    }

    // eliminar una persona
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deletePersona(@PathVariable Long id) {
        personaService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Persona eliminada"));
    }
}