package com.florarte.backend.repositories;

import com.florarte.backend.entities.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    @Query("SELECT p FROM Pedido p LEFT JOIN FETCH p.cliente LEFT JOIN FETCH p.empleado ORDER BY p.idPedido DESC")
    List<Pedido> findAllWithPersonas();

    @Query("SELECT p FROM Pedido p LEFT JOIN FETCH p.cliente LEFT JOIN FETCH p.empleado WHERE p.idPedido = :id")
    Optional<Pedido> findByIdWithPersonas(@Param("id") Integer id);

    List<Pedido> findByIdCliente(Long idCliente);

    List<Pedido> findByIdEmpleado(Long idEmpleado);

    List<Pedido> findByEstado(String estado);
}
