package com.florarte.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Detalle_EntradaDTO {

    private Integer idDetalleEntrada;

    @NotNull(message = "El id de entrada es obligatorio")
    private Integer idEntrada;

    @NotNull(message = "El id de flor es obligatorio")
    private Integer idFlor;

    private String nombreFlor;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @NotNull(message = "El precio de compra es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El precio de compra no puede ser negativo")
    private BigDecimal precioCompra;

    private BigDecimal subtotal;
}
