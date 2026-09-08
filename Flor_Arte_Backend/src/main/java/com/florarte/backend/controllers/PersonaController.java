package com.florarte.backend.controllers;

import com.florarte.backend.entities.Persona;
import com.florarte.backend.services.PersonaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    // obtener las personas
    @GetMapping("/all")
    public ResponseEntity<?> getAllPersonas() {
        return ResponseEntity.ok(personaService.findAll());
    }

    // obtener una persona por id
    @GetMapping("/id")
    public ResponseEntity<?> getPesonaById(@PathVariable Long id) {
        Persona persona = personaService.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada con id: " + id));
        return ResponseEntity.ok(persona);
    }

    // crear persona
    @PostMapping("/create")
    public ResponseEntity<?> createPersona(@RequestBody Persona persona) {
        Persona nueva = personaService.save(persona);
        return ResponseEntity.ok(Map.of("message", "Persona creada", "persona", nueva));
    }

    // actualizar una persona
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updatePersona(@PathVariable Long id, @RequestBody Persona persona) {
        Persona actualizada = personaService.update(id, persona);
        return ResponseEntity.ok(Map.of("message", "Persona actualizada", "persona", actualizada));
    }

    // eliminar una persona
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deletePersona(@PathVariable Long id) {
        personaService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Persona eliminada"));
    }
}
