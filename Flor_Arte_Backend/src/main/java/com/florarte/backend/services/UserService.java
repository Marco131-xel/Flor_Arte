package com.florarte.backend.services;

import com.florarte.backend.dtos.UpdateUserDto;
import com.florarte.backend.dtos.UserListDTO;
import com.florarte.backend.entities.User;
import com.florarte.backend.repositories.UserRepository;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@NoArgsConstructor
@Service
public class UserService implements UserDetailsService {

    private UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // buscar usuario por email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado " + email));

        //validar que el usuario este activo
        if(!user.getEstado()) {
            throw new UsernameNotFoundException("Usuario inactivo");
        }

        // obtener el rol
        String rolTipo = user.getPersona().getRol().getTipo();
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + rolTipo);

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singleton(authority)
        );
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // guardar usuarios
    public void save(User user) {
        userRepository.save(user);
    }

    // encontrar usuarios por correo
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // encontrar usuarios por id
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User updateUser(Long id, UpdateUserDto dto) {
        return userRepository.findById(id).map(user -> {
            user.setEmail(dto.getEmail());
            user.setPassword(dto.getPassword());
            user.setEstado(dto.getEstado());
            user.setIdPersona(dto.getIdPersona());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }

    public List<UserListDTO> findAll() {
        return userRepository.findAll()
                .stream()
                .map(user -> {
                    var persona = user.getPersona();

                    return new UserListDTO(
                            user.getIdUsuario(),
                            user.getName(),
                            user.getEmail(),
                            user.getEstado(),
                            persona.getIdPersona(),
                            persona.getNombre(),
                            persona.getTelefono(),
                            persona.getDpi(),
                            persona.getRol().getTipo()
                    );
                })
                .collect(Collectors.toList());
    }

    public List<User> findAllEmpleado() {
        return userRepository.findAll()
                .stream()
                .filter(user -> {
                    try {
                        return "EMPLEADO".equalsIgnoreCase(user.getPersona().getRol().getTipo());
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }

    public List<User> findAllNoEmpleados() {
        return userRepository.findAll()
                .stream()
                .filter(user -> {
                    try {
                        return !"EMPLEADO".equalsIgnoreCase(user.getPersona().getRol().getTipo());
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }
}
