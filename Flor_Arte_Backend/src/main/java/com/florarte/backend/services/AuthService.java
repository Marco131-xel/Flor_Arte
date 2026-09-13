package com.florarte.backend.services;

import com.florarte.backend.entities.User;
import com.florarte.backend.jwt.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    @Autowired
    public AuthService(UserService userService, JwtUtil jwtUtil, AuthenticationManagerBuilder authenticationManagerBuilder) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.authenticationManagerBuilder = authenticationManagerBuilder;
    }

    public String authenticate(String correo, String contrasena) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(correo, contrasena);
        Authentication authResult = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authResult);

        User user = userService.findByEmail(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return jwtUtil.generateTokenClaims(correo, user.getPersona().getRol().getTipo());
    }

    public User getUserByCorreo(String correo) {
        return userService.findByEmail(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }
}
