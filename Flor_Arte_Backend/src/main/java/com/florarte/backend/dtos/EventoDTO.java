package com.florarte.backend.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

public record EventoDTO(
    @NotBlank @Size(max=150) String nombre,
    @NotNull @Positive Long idCliente,
    @Positive Long idEmpleado,
    @NotNull LocalDateTime fecha,
    @NotNull @Min(0) @Max(365) Integer diasPreparacion,
    @Size(max=5000) String descripcion,
    @Size(max=250) String ubicacion,
    @NotEmpty @Size(max=200) List<@NotNull @Valid Item> detalles,
    @DecimalMin("0") @Digits(integer=8,fraction=2) BigDecimal importe
) {
    public EventoDTO(String nombre,Long idCliente,Long idEmpleado,LocalDateTime fecha,Integer diasPreparacion,String descripcion,String ubicacion,List<Item> detalles){
        this(nombre,idCliente,idEmpleado,fecha,diasPreparacion,descripcion,ubicacion,detalles,null);
    }
    public record Item(@NotNull @Positive Integer idFlor,@NotNull @Positive Integer cantidad) {}
}
