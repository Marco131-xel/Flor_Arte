package com.florarte.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserDto {
    private Long idUsuario;
    private String email;
    private String password;
    private String token;
    private Boolean estado;
    private Long idPersona;
    private String nombrePersona;
    private String rolPersona;
}
