package com.florarte.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "detalle_entrada")
public class Detalle_Entrada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_entrada")
    private Integer idDetalleEntrada;

    @Column(name = "id_entrada", nullable = false)
    private Integer idEntrada;

    @Column(name = "id_flor", nullable = false)
    private Integer idFlor;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "precio_compra", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioCompra;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    // Relación con Entrada_Inventario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entrada", insertable = false, updatable = false)
    private Entrada_Inventario entrada;

    // Relación con Flor
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_flor", insertable = false, updatable = false)
    private Flor flor;
}
