package com.florarte.backend.dtos;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonaDTO {
    private Long idPersona;
    private String nombre;
    private String telefono;
    private String dpi;
    private String correo;
    private String tipoRol;
}
