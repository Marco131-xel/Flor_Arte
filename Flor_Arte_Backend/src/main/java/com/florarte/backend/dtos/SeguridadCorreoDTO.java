package com.florarte.backend.dtos;

import jakarta.validation.constraints.*;

public class SeguridadCorreoDTO {
  public record Verificar(
      @NotBlank @Size(max = 36) String challengeId,
      @NotBlank @Pattern(regexp = "[0-9]{6}", message = "Ingresa los seis dígitos del código")
          String codigo) {}

  public record Reenviar(@NotBlank @Size(max = 36) String challengeId) {}

  public record Recuperar(@NotBlank @Email @Size(max = 150) String correo) {}

  public record Restablecer(
      @NotBlank @Size(max = 100) String token,
      @NotBlank @Size(min = 8, max = 72) String contrasena,
      @NotBlank @Size(max = 72) String confirmacion) {}

  public record Configurar(
      @NotNull Boolean habilitado, @NotBlank @Size(max = 256) String contrasena) {}
}
