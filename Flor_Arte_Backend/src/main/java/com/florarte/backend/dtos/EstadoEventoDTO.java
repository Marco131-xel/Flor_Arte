package com.florarte.backend.dtos;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record EstadoEventoDTO(
    @NotBlank @Pattern(regexp="PENDIENTE|CONFIRMADO|TRABAJANDO|REALIZADO|PAGADO|CANCELADO") String estado,
    @DecimalMin("0") @Digits(integer=8,fraction=2) BigDecimal importe
) { public EstadoEventoDTO(String estado){this(estado,null);} }
