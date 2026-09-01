package com.florarte.backend.services;
import com.florarte.backend.entities.Persona;
import com.florarte.backend.repositories.PersonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PersonaService {

    private final PersonaRepository personaRepository;

    @Autowired
    public PersonaService(PersonaRepository personaRepository) {
        this.personaRepository = personaRepository;
    }

    public Persona save(Persona persona) {
        return personaRepository.save(persona);
    }

    public Optional<Persona> findByCorreo(String correo) {
        return personaRepository.findByCorreo(correo);
    }

    public boolean existsByCorreo(String correo) {
        return personaRepository.existsByCorreo(correo);
    }
}
