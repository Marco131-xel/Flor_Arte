package com.florarte.backend.repositories;

import com.florarte.backend.entities.Detalle_Entrada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Deta_EntraRepository extends JpaRepository<Detalle_Entrada, Integer> {

    @Query("SELECT d FROM Detalle_Entrada d LEFT JOIN FETCH d.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color WHERE d.idEntrada = :idEntrada")
    List<Detalle_Entrada> findByIdEntradaWithFlor(@Param("idEntrada") Integer idEntrada);

    @Query("SELECT d FROM Detalle_Entrada d LEFT JOIN FETCH d.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color")
    List<Detalle_Entrada> findAllWithFlor();

    @Query("SELECT d FROM Detalle_Entrada d LEFT JOIN FETCH d.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color WHERE d.idDetalleEntrada = :id")
    Optional<Detalle_Entrada> findByIdWithFlor(@Param("id") Integer id);

    boolean existsByIdFlor(Integer idFlor);

    List<Detalle_Entrada> findByIdEntrada(Integer idEntrada);
}
