package com.florarte.backend.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record ArregloDTO(
    @NotBlank @Size(max=100) String nombre,
    @Size(max=5000) String descripcion,
    @NotNull @DecimalMin("0") @Digits(integer=8,fraction=2) BigDecimal precio,
    @NotEmpty @Size(max=200) List<@NotNull @Valid Item> detalles,
    @Size(max=2048) String imagenUrl
) {
    public ArregloDTO(String nombre,String descripcion,BigDecimal precio,List<Item> detalles) {
        this(nombre,descripcion,precio,detalles,null);
    }
    public record Item(@NotNull @Positive Integer idFlor, @NotNull @Positive Integer cantidad) {}
}
