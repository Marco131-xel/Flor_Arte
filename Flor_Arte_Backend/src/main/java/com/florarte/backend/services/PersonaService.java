package com.florarte.backend.services;

import com.florarte.backend.entities.Persona;
import com.florarte.backend.repositories.PersonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PersonaService {

    private final PersonaRepository personaRepository;

    @Autowired
    public PersonaService(PersonaRepository personaRepository) {
        this.personaRepository = personaRepository;
    }

    // funcion para crear persona
    public Persona save(Persona persona) {
        return personaRepository.save(persona);
    }

    // funcion para listar todas las personas
    public List<Persona> findAll() {
        return personaRepository.findAll();
    }

    // funcion para buscar por id la persona
    public Optional<Persona> findById(Long idPersona) {
        return personaRepository.findById(idPersona);
    }

    // funcion para buscar por correo la persona
    public Optional<Persona> findByCorreo(String correo) {
        return personaRepository.findByCorreo(correo);
    }

    // funcion para actualizar la persona
    public Persona update(Long idPersona, Persona personaupdate) {
        return personaRepository.findById(idPersona)
                .map(persona -> {
                    persona.setNombre(personaupdate.getNombre());
                    persona.setTelefono(personaupdate.getTelefono());
                    persona.setDpi(personaupdate.getDpi());
                    persona.setCorreo(personaupdate.getCorreo());
                    persona.setIdRol(personaupdate.getIdRol());
                    return personaRepository.save(persona);
                })
                .orElseThrow(() -> new RuntimeException("Persona no encontrada con id: " + idPersona));
    }

    // funcion para eliminar personas
    public void deleteById(Long idPersona) {
        if (!personaRepository.existsById(idPersona)) {
            throw new RuntimeException("Persona no encontrada con id: " + idPersona);
        }
        personaRepository.deleteById(idPersona);
    }

    // validaciones de existencias
    public boolean existsByCorreo(String correo) {
        return personaRepository.existsByCorreo(correo);
    }

    public boolean existsByDpi(String dpi) {
        return personaRepository.existsByDpi(dpi);
    }
}
