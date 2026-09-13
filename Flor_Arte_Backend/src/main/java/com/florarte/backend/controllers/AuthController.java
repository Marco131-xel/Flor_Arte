package com.florarte.backend.controllers;

import com.florarte.backend.dtos.LoginUserDto;
import com.florarte.backend.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginUserDto loginUserDto) {
        String jwt = authService.authenticate(loginUserDto.getCorreo(), loginUserDto.getContrasena());
        var user = authService.getUserByCorreo(loginUserDto.getCorreo());

        return ResponseEntity.ok(Map.of(
                "message", "Inicio de sesion exitoso",
                "token", jwt,
                "nombre", user.getPersona().getNombre(),
                "tipoUsuario", user.getPersona().getRol().getTipo(),
                "id_usuario", user.getIdUsuario(),
                "estado", user.getEstado()
        ));
    }

    @GetMapping("/check-auth")
    public ResponseEntity<String> checkAuth() {
        return ResponseEntity.ok().body("Autenticado");
    }
}
