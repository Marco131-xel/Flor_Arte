package com.florarte.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EstadoPedidoDTO(
    @NotBlank(message = "Selecciona un estado")
    @Pattern(regexp = "PENDIENTE|CONFIRMADO|PREPARANDO|LISTO|ENTREGADO|CANCELADO", message = "Estado de pedido inválido")
    String estado
) {}
