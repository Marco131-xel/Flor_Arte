package com.florarte.backend.repositories;

import com.florarte.backend.entities.Detalle_Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Deta_PediRepository extends JpaRepository<Detalle_Pedido, Integer> {

    @Query("SELECT d FROM Detalle_Pedido d LEFT JOIN FETCH d.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color WHERE d.idPedido = :idPedido")
    List<Detalle_Pedido> findByIdPedidoWithFlor(@Param("idPedido") Integer idPedido);

    @Query("SELECT d FROM Detalle_Pedido d LEFT JOIN FETCH d.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color")
    List<Detalle_Pedido> findAllWithFlor();

    @Query("SELECT d FROM Detalle_Pedido d LEFT JOIN FETCH d.flor f LEFT JOIN FETCH f.tipoFlor LEFT JOIN FETCH f.color WHERE d.idDetallePedido = :id")
    Optional<Detalle_Pedido> findByIdWithFlor(@Param("id") Integer id);

    List<Detalle_Pedido> findByIdPedido(Integer idPedido);

    boolean existsByIdFlor(Integer idFlor);
}
