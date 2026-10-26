package com.florarte.backend.dtos;

import jakarta.validation.constraints.*;

public record PedidoArregloDTO(
    @NotNull @Positive Long idCliente,
    @Positive Long idEmpleado,
    @NotNull @Positive Integer idArreglo,
    @NotNull @Positive Integer cantidad
) {}
