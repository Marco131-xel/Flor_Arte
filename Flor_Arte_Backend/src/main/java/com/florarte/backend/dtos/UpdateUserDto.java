package com.florarte.backend.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserDto {

    private Long idUsuario;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato de correo no es válido")
    @Size(max = 150, message = "El correo no puede superar los 150 caracteres")
    private String email;

    private String password;

    private String token;

    @NotNull(message = "El estado es obligatorio")
    private Boolean estado;

    @NotNull(message = "El id de persona es obligatorio")
    private Long idPersona;

    private String nombrePersona;
    private String rolPersona;
}
