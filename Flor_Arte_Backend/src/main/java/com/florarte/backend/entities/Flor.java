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
@Table(name = "flor", uniqueConstraints = {
        @UniqueConstraint(name = "uq_flor_tipo_color", columnNames = {"id_tipo_flor", "id_color"})
})
public class Flor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_flor")
    private Integer idFlor;

    @Column(name = "id_tipo_flor", nullable = false)
    private Integer idTipoFlor;

    @Column(name = "id_color", nullable = false)
    private Integer idColor;

    @Column(name = "precio", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "stock", nullable = false)
    private Integer stock = 0;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    // Relación con TipoFlor
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_flor", insertable = false, updatable = false)
    private TipoFlor tipoFlor;

    // Relación con Color
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_color", insertable = false, updatable = false)
    private Color color;
}
