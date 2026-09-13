package com.florarte.backend.services;

import com.florarte.backend.dtos.PersonaDTO;
import com.florarte.backend.entities.Persona;
import com.florarte.backend.entities.Rol;
import com.florarte.backend.repositories.PersonaRepository;
import com.florarte.backend.repositories.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PersonaService {

    private final PersonaRepository personaRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public PersonaService(PersonaRepository personaRepository, RoleRepository roleRepository) {
        this.personaRepository = personaRepository;
        this.roleRepository = roleRepository;
    }

    private boolean isCurrentUserEmpleado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLEADO"));
    }

    // funcion para crear persona mediante DTO con validacion de rol
    public PersonaDTO save(PersonaDTO dto) {
        if (dto.getCorreo() != null && !dto.getCorreo().isBlank() && personaRepository.existsByCorreo(dto.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }
        if (dto.getDpi() != null && !dto.getDpi().isBlank() && personaRepository.existsByDpi(dto.getDpi())) {
            throw new IllegalArgumentException("El DPI ya está registrado");
        }

        Rol rol = roleRepository.findById(dto.getIdRol())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado con id: " + dto.getIdRol()));

        if (isCurrentUserEmpleado()) {
            if (!"CLIENTE".equalsIgnoreCase(rol.getTipo()) && !"PROVEEDOR".equalsIgnoreCase(rol.getTipo())) {
                throw new AccessDeniedException("Los empleados solo tienen permitido registrar personas con rol CLIENTE o PROVEEDOR");
            }
        }

        Persona persona = new Persona();
        persona.setNombre(dto.getNombre());
        persona.setTelefono(dto.getTelefono());
        persona.setDpi(dto.getDpi());
        persona.setCorreo(dto.getCorreo());
        persona.setIdRol(dto.getIdRol());

        Persona nueva = personaRepository.save(persona);
        return toDto(nueva, rol.getTipo());
    }

    // funcion para crear persona directamente
    public Persona save(Persona persona) {
        return personaRepository.save(persona);
    }

    // funcion para listar todas las personas
    public List<PersonaDTO> findAll() {
        return personaRepository.findAllWithRol()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // funcion para buscar por id la persona
    public Optional<PersonaDTO> findById(Long idPersona) {
        return personaRepository.findByIdWithRol(idPersona).map(this::toDto);
    }

    // funcion para buscar por correo la persona
    public Optional<Persona> findByCorreo(String correo) {
        return personaRepository.findByCorreo(correo);
    }

    // funcion para actualizar la persona
    public PersonaDTO update(Long idPersona, PersonaDTO dto) {
        Persona persona = personaRepository.findByIdWithRol(idPersona)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada con id: " + idPersona));

        Rol targetRol = roleRepository.findById(dto.getIdRol())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado con id: " + dto.getIdRol()));

        if (isCurrentUserEmpleado()) {
            String currentRolTipo = persona.getRol() != null ? persona.getRol().getTipo() : "";
            if ("ADMINISTRADOR".equalsIgnoreCase(currentRolTipo) || "EMPLEADO".equalsIgnoreCase(currentRolTipo)) {
                throw new AccessDeniedException("Los empleados no tienen permitido modificar personas con rol ADMINISTRADOR o EMPLEADO");
            }
            if (!"CLIENTE".equalsIgnoreCase(targetRol.getTipo()) && !"PROVEEDOR".equalsIgnoreCase(targetRol.getTipo())) {
                throw new AccessDeniedException("Los empleados solo pueden asignar roles CLIENTE o PROVEEDOR");
            }
        }

        if (dto.getCorreo() != null && !dto.getCorreo().equalsIgnoreCase(persona.getCorreo()) && personaRepository.existsByCorreo(dto.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está en uso");
        }

        if (dto.getDpi() != null && !dto.getDpi().equalsIgnoreCase(persona.getDpi()) && personaRepository.existsByDpi(dto.getDpi())) {
            throw new IllegalArgumentException("El DPI ya está en uso");
        }

        persona.setNombre(dto.getNombre());
        persona.setTelefono(dto.getTelefono());
        persona.setDpi(dto.getDpi());
        persona.setCorreo(dto.getCorreo());
        persona.setIdRol(dto.getIdRol());

        Persona actualizada = personaRepository.save(persona);
        return toDto(actualizada, targetRol.getTipo());
    }

    // funcion para eliminar personas
    public void deleteById(Long idPersona) {
        Persona persona = personaRepository.findByIdWithRol(idPersona)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada con id: " + idPersona));

        if (isCurrentUserEmpleado()) {
            String currentRolTipo = persona.getRol() != null ? persona.getRol().getTipo() : "";
            if ("ADMINISTRADOR".equalsIgnoreCase(currentRolTipo) || "EMPLEADO".equalsIgnoreCase(currentRolTipo)) {
                throw new AccessDeniedException("Los empleados no tienen permitido eliminar personas con rol ADMINISTRADOR o EMPLEADO");
            }
        }

        personaRepository.deleteById(idPersona);
    }

    // validaciones de existencias
    public boolean existsByCorreo(String correo) {
        return personaRepository.existsByCorreo(correo);
    }

    public boolean existsByDpi(String dpi) {
        return personaRepository.existsByDpi(dpi);
    }

    private PersonaDTO toDto(Persona p) {
        return new PersonaDTO(
                p.getIdPersona(),
                p.getNombre(),
                p.getTelefono(),
                p.getDpi(),
                p.getCorreo(),
                p.getIdRol(),
                p.getRol() != null ? p.getRol().getTipo() : null
        );
    }

    private PersonaDTO toDto(Persona p, String tipoRol) {
        return new PersonaDTO(
                p.getIdPersona(),
                p.getNombre(),
                p.getTelefono(),
                p.getDpi(),
                p.getCorreo(),
                p.getIdRol(),
                tipoRol
        );
    }
}
