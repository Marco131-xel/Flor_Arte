package com.florarte.backend.repositories;

import com.florarte.backend.entities.Flor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlorRepository extends JpaRepository<Flor, Integer> {

    @Query("SELECT f FROM Flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color")
    List<Flor> findAllWithDetails();

    @Query("SELECT f FROM Flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color WHERE f.idFlor = :id")
    Optional<Flor> findByIdWithDetails(@Param("id") Integer id);

    boolean existsByIdTipoFlorAndIdColor(Integer idTipoFlor, Integer idColor);

    boolean existsByIdTipoFlorAndIdColorAndIdFlorNot(Integer idTipoFlor, Integer idColor, Integer idFlor);

    boolean existsByIdTipoFlor(Integer idTipoFlor);

    boolean existsByIdColor(Integer idColor);
}
