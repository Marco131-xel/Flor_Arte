package com.florarte.backend.repositories;

import com.florarte.backend.entities.Movimiento_Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Mov_InvRepository extends JpaRepository<Movimiento_Inventario, Integer> {

    @Query("SELECT m FROM Movimiento_Inventario m LEFT JOIN FETCH m.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color ORDER BY m.fecha DESC")
    List<Movimiento_Inventario> findAllWithFlor();

    @Query("SELECT m FROM Movimiento_Inventario m LEFT JOIN FETCH m.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color WHERE m.idMovimientoInventario = :id")
    Optional<Movimiento_Inventario> findByIdWithFlor(@Param("id") Integer id);

    @Query("SELECT m FROM Movimiento_Inventario m LEFT JOIN FETCH m.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color WHERE m.idFlor = :idFlor ORDER BY m.fecha DESC")
    List<Movimiento_Inventario> findByIdFlorWithFlor(@Param("idFlor") Integer idFlor);
}
