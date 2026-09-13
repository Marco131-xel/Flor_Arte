package com.florarte.backend.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonaDTO {

    private Long idPersona;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombre;

    @Size(max = 20, message = "El teléfono no puede superar los 20 caracteres")
    private String telefono;

    @Size(max = 20, message = "El DPI no puede superar los 20 caracteres")
    private String dpi;

    @Email(message = "El formato de correo no es válido")
    @Size(max = 150, message = "El correo no puede superar los 150 caracteres")
    private String correo;

    @NotNull(message = "El rol es obligatorio")
    private Long idRol;

    private String tipoRol;
}
