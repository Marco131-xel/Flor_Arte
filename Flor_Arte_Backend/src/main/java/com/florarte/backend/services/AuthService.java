package com.florarte.backend.services;

import com.florarte.backend.dtos.NewUserDto;
import com.florarte.backend.entities.Persona;
import com.florarte.backend.entities.Rol;
import com.florarte.backend.entities.User;
import com.florarte.backend.enums.RoleList;
import com.florarte.backend.jwt.JwtUtil;
import com.florarte.backend.repositories.RoleRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;
    private final PersonaService personaService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    @Autowired
    public AuthService(UserService userService, PersonaService personaService, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AuthenticationManagerBuilder authenticatioManagerBuilder ) {
        this.userService = userService;
        this.personaService = personaService;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManagerBuilder = authenticatioManagerBuilder;
    }

    public String authenticate(String correo, String contrasena) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(correo, contrasena);
        Authentication authResult = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authResult);

        User user = userService.findByEmail(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return jwtUtil.generateTokenClaims(correo, user.getPersona().getRol().getTipo());
    }

    @Transactional
    /*public void registerUser(NewUserDto dto) {
        if (userService.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        // validar el rol ingresado
        RoleList roleName = RoleList.valueOf(dto.getRolPersona().toUpperCase());

        // buscar relacion del rol con la DB
        Rol rol = roleRepository.findByTipo(roleName.name())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + dto.getRolPersona()));

        Persona persona = new Persona();
        persona.setNombre(dto.getNombrePersona());
        persona.setCorreo(dto.getEmail());
        persona.setIdRol(rol.getIdRol());
        persona = personaService.save(persona);

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setIdPersona(persona.getIdPersona());
        user.setEstado(true);
        userService.save(user);
    }*/

    public User getUserByCorreo(String correo) {
        return userService.findByEmail(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }
}
