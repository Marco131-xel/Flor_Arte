package com.florarte.backend.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record UpdatePedidoCompletoDTO(
        @NotNull @Positive Long idCliente,
        @Positive Long idEmpleado,
        @NotBlank String estado,
        @NotEmpty List<@NotNull @Valid Item> detalles
) {
    public record Item(
            @Positive Integer idDetallePedido,
            @NotNull @Positive Integer idFlor,
            @NotNull @Positive Integer cantidad,
            @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal precio
    ) {}
}
