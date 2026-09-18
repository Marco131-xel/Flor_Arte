package com.florarte.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Entrada_InventarioDTO {

    private Integer idEntrada;

    @NotNull(message = "El proveedor es obligatorio")
    private Long idPersona;

    private String nombrePersona;

    private LocalDateTime fecha;

    @DecimalMin(value = "0.0", inclusive = true, message = "El total no puede ser negativo")
    private BigDecimal total;

    private List<Detalle_EntradaDTO> detalles;
}
