package com.florarte.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserListDTO {

    private Long idUsuario;
    private String name;
    private String email;
    private Boolean estado;

    private Long idPersona;
    private String nombre;
    private String telefono;
    private String dpi;
    private String rol;
}