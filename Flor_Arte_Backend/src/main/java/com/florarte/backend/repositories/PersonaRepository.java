package com.florarte.backend.repositories;

import com.florarte.backend.entities.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonaRepository extends JpaRepository<Persona, Long> {

    @Query("SELECT p FROM Persona p LEFT JOIN FETCH p.rol")
    List<Persona> findAllWithRol();

    @Query("SELECT p FROM Persona p LEFT JOIN FETCH p.rol WHERE p.idPersona = :id")
    Optional<Persona> findByIdWithRol(@Param("id") Long id);

    Optional<Persona> findByCorreo(String correo);
    boolean existsByCorreo(String correo);
    boolean existsByDpi(String dpi);
}
