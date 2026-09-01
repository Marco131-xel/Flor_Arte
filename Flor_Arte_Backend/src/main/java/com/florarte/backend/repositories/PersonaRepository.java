package com.florarte.backend.repositories;

import com.florarte.backend.entities.Persona;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PersonaRepository extends JpaRepository<Persona, Long> {
    Optional<Persona> findByCorreo(String correo);
    boolean existsByCorreo(String correo);
    boolean existsByDpi(String dpi);
}
