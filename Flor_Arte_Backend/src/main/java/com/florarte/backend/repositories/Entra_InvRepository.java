package com.florarte.backend.repositories;

import com.florarte.backend.entities.Entrada_Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Entra_InvRepository extends JpaRepository<Entrada_Inventario, Integer> {

    @Query("SELECT e FROM Entrada_Inventario e LEFT JOIN FETCH e.persona ORDER BY e.fecha DESC")
    List<Entrada_Inventario> findAllWithPersona();

    @Query("SELECT e FROM Entrada_Inventario e LEFT JOIN FETCH e.persona WHERE e.idEntrada = :id")
    Optional<Entrada_Inventario> findByIdWithPersona(@Param("id") Integer id);

    List<Entrada_Inventario> findByIdPersona(Long idPersona);
}
