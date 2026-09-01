package com.florarte.backend.controllers;

import com.florarte.backend.dtos.UpdateUserDto;
import com.florarte.backend.dtos.UserProfileDto;
import com.florarte.backend.entities.User;
import com.florarte.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // obtener datos del usuario autenticado
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        var email = userDetails.getUsername();
        var user = userService.findByEmail(email).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        var persona = user.getPersona();
        UserProfileDto dto = new UserProfileDto(
                persona.getNombre(),
                persona.getTelefono(),
                persona.getDpi(),
                persona.getCorreo(),
                user.getEstado(),
                user.getIdPersona(),
                persona.getRol().getTipo()
        );

        return ResponseEntity.ok(dto);
    }

    // eliminar cuenta del usuario autenticado
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteMyAccount(@AuthenticationPrincipal UserDetails userDetails) {
        var email = userDetails.getUsername();
        var user = userService.findByEmail(email).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        userService.deleteUser(user.getIdUsuario());
        return ResponseEntity.ok(Map.of("message", "Cuenta eliminada"));
    }

    // obtener todos los usuarios
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    /* FUNCIONES ADMIN */
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUserByYd(@PathVariable Long id, @RequestBody UpdateUserDto dto) {
        User updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(Map.of("message", "Usuario actualizado", "user", updated));
    }
}
