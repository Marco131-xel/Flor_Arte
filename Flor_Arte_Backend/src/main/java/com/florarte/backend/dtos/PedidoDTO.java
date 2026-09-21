package com.florarte.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PedidoDTO {

    private Integer idPedido;

    @NotNull(message = "El cliente es obligatorio")
    private Long idCliente;

    private String nombreCliente;

    private Long idEmpleado;

    private String nombreEmpleado;

    private String estado;

    @DecimalMin(value = "0.0", inclusive = true, message = "El total no puede ser negativo")
    private BigDecimal total;

    private List<Deta_PediDTO> detalles;
}
