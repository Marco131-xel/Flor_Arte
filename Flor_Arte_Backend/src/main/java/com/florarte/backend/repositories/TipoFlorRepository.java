package com.florarte.backend.repositories;

import com.florarte.backend.entities.TipoFlor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoFlorRepository extends JpaRepository<TipoFlor, Integer> {

    Optional<TipoFlor> findByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCase(String nombre);
}
