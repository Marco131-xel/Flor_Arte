package com.florarte.backend.services;

import com.florarte.backend.entities.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final UserService userService;
  private final AuthenticationManagerBuilder authenticationManagerBuilder;

  public AuthService(
      UserService userService, AuthenticationManagerBuilder authenticationManagerBuilder) {
    this.userService = userService;
    this.authenticationManagerBuilder = authenticationManagerBuilder;
  }

  public User authenticate(String correo, String contrasena) {
    var anterior = userService.findByEmail(correo.strip());
    authenticationManagerBuilder
        .getObject()
        .authenticate(new UsernamePasswordAuthenticationToken(correo.strip(), contrasena));
    // La primera credencial no concede una sesión ni establece SecurityContext.
    return anterior.orElseThrow(
        () ->
            new org.springframework.security.authentication.BadCredentialsException(
                "Credenciales inválidas"));
  }

  public User getUserByCorreo(String correo) {
    return userService
        .findByEmail(correo)
        .orElseThrow(
            () ->
                new org.springframework.security.authentication.BadCredentialsException(
                    "Credenciales inválidas"));
  }
}
