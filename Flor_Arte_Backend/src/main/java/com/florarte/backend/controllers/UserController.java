package com.florarte.backend.controllers;

import com.florarte.backend.dtos.NewUserDto;
import com.florarte.backend.dtos.UpdateUserDto;
import com.florarte.backend.dtos.UserProfileDto;
import com.florarte.backend.entities.User;
import com.florarte.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // crear usuarios por persona
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping("/create")
    public ResponseEntity<?> createUser(@Valid @RequestBody NewUserDto dto) {
        User user = userService.createUser(dto);
        return ResponseEntity.ok(Map.of("message", "Usuario creado", "user", user));
    }

    // eliminar usuario por id (solo admin)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteUserById(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Usuario eliminado"));
    }

    // obtener todos los usuarios (solo admin)
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    // poder editar un usuario solo (admin)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUserById(@PathVariable Long id, @Valid @RequestBody UpdateUserDto dto) {
        User updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(Map.of("message", "Usuario actualizado", "user", updated));
    }

    // obtener datos del usuario
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserId(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
        return ResponseEntity.ok(user);
    }
}
