package com.florarte.backend.dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Movimiento_InventarioDTO {

    private Integer idMovimientoInventario;

    @NotNull(message = "El id de flor es obligatorio")
    private Integer idFlor;

    private String nombreFlor;

    @NotBlank(message = "El tipo de movimiento es obligatorio")
    private String tipoMovimiento;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;

    private LocalDateTime fecha;

    @jakarta.validation.constraints.DecimalMin(value="0", message="El costo no puede ser negativo")
    @jakarta.validation.constraints.Digits(integer=10, fraction=6, message="El costo admite 10 enteros y 6 decimales")
    private java.math.BigDecimal costoUnitario;
    private java.math.BigDecimal perdida;

    public Movimiento_InventarioDTO(Integer id,Integer flor,String nombre,String tipo,Integer cantidad,String motivo,LocalDateTime fecha) {
        this(id,flor,nombre,tipo,cantidad,motivo,fecha,null,null);
    }
}
