package com.florarte.backend.controllers;

import com.florarte.backend.dtos.LoginUserDto;
import com.florarte.backend.dtos.SeguridadCorreoDTO.*;
import com.florarte.backend.services.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AuthService auth;
  private final DesafioAuthService desafios;
  private final RecuperacionService recuperacion;
  private final LimiteAuthService limite;

  public AuthController(
      AuthService auth,
      DesafioAuthService desafios,
      RecuperacionService recuperacion,
      LimiteAuthService limite) {
    this.auth = auth;
    this.desafios = desafios;
    this.recuperacion = recuperacion;
    this.limite = limite;
  }

  @PostMapping("/login")
  public Map<String, Object> login(
      @Valid @RequestBody LoginUserDto dto, HttpServletRequest request) {
    limite.consumir("login-ip:" + request.getRemoteAddr(), 30, 900);
    limite.consumir("login-email:" + dto.getCorreo().strip().toLowerCase(Locale.ROOT), 10, 900);
    var u = auth.authenticate(dto.getCorreo(), dto.getContrasena());
    return desafios.iniciar(u.getIdUsuario(), u.getAuthVersion(), "LOGIN", null);
  }

  @PostMapping("/2fa/verificar")
  public Map<String, Object> verificar(
      @Valid @RequestBody Verificar dto, HttpServletRequest request) {
    limite.consumir("verificar-ip:" + request.getRemoteAddr(), 60, 900);
    return desafios.verificar(dto.challengeId(), dto.codigo(), "LOGIN", null);
  }

  @PostMapping("/2fa/reenviar")
  public Map<String, Object> reenviar(
      @Valid @RequestBody Reenviar dto, HttpServletRequest request) {
    limite.consumir("reenviar-ip:" + request.getRemoteAddr(), 30, 900);
    return desafios.reenviar(dto.challengeId(), "LOGIN", null);
  }

  @PostMapping("/recuperacion/solicitar")
  public Map<String, String> solicitar(
      @Valid @RequestBody Recuperar dto, HttpServletRequest request) {
    limite.consumir("recuperar-ip:" + request.getRemoteAddr(), 10, 900);
    limite.consumir("recuperar-email:" + dto.correo().strip().toLowerCase(Locale.ROOT), 3, 900);
    recuperacion.solicitar(dto.correo());
    return Map.of(
        "message",
        "Si el correo corresponde a una cuenta activa, recibirás un enlace para restablecer la"
            + " contraseña.");
  }

  @PreAuthorize("hasRole('ADMINISTRADOR')")
  @PostMapping("/recuperacion/empleado/{id}")
  public Map<String, String> solicitarEmpleado(@PathVariable long id, Principal principal) {
    limite.consumir("recuperar-admin:" + principal.getName(), 10, 900);
    limite.consumir("recuperar-empleado:" + id, 3, 900);
    recuperacion.solicitarEmpleado(id);
    return Map.of(
        "message",
        "Solicitud procesada. El empleado recibirá un enlace de recuperación en su correo"
            + " registrado; tendrá una vigencia de 15 minutos.");
  }

  @PostMapping("/recuperacion/restablecer")
  public Map<String, String> restablecer(
      @Valid @RequestBody Restablecer dto, HttpServletRequest request) {
    limite.consumir("restablecer-ip:" + request.getRemoteAddr(), 30, 900);
    recuperacion.restablecer(dto.token(), dto.contrasena(), dto.confirmacion());
    return Map.of("message", "Tu contraseña fue actualizada. Inicia sesión nuevamente.");
  }

  @PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
  @GetMapping("/2fa/configuracion")
  public Map<String, Object> configuracion(Principal p) {
    return desafios.configuracion(p.getName());
  }

  @PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
  @PostMapping("/2fa/configuracion/iniciar")
  public Map<String, Object> configurar(
      @Valid @RequestBody Configurar dto, Principal p, HttpServletRequest r) {
    limite.consumir("configurar:" + p.getName(), 5, 900);
    var u = auth.authenticate(p.getName(), dto.contrasena());
    return desafios.iniciar(u.getIdUsuario(), u.getAuthVersion(), "CONFIGURAR", dto.habilitado());
  }

  @PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
  @PostMapping("/2fa/configuracion/verificar")
  public Map<String, Object> confirmar(
      @Valid @RequestBody Verificar dto, Principal p, HttpServletRequest r) {
    limite.consumir("verificar-config:" + p.getName(), 30, 900);
    return desafios.verificar(dto.challengeId(), dto.codigo(), "CONFIGURAR", p.getName());
  }

  @PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
  @PostMapping("/2fa/configuracion/reenviar")
  public Map<String, Object> reenviarConfiguracion(@Valid @RequestBody Reenviar dto, Principal p) {
    return desafios.reenviar(dto.challengeId(), "CONFIGURAR", p.getName());
  }

  @GetMapping("/check-auth")
  public String checkAuth() {
    return "Autenticado";
  }
}
