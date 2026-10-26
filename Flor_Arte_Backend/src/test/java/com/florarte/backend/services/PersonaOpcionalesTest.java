package com.florarte.backend.services;

import com.florarte.backend.dtos.PersonaDTO;
import com.florarte.backend.entities.*;
import com.florarte.backend.repositories.*;
import jakarta.validation.Validation;
import java.util.Optional;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PersonaOpcionalesTest {
    PersonaRepository personas; RoleRepository roles; PersonaService servicio;
    @BeforeEach void preparar() {
        personas=mock(PersonaRepository.class);roles=mock(RoleRepository.class);
        servicio=new PersonaService(personas,roles);
        Rol rol=new Rol();rol.setIdRol(3L);rol.setTipo("CLIENTE");
        when(roles.findById(3L)).thenReturn(Optional.of(rol));
        when(personas.save(any())).thenAnswer(inv->{Persona p=inv.getArgument(0);p.setIdPersona(1L);return p;});
    }
    PersonaDTO dto(String nombre,String dpi,String correo) {
        return new PersonaDTO(null,nombre,"",dpi,correo,3L,null);
    }
    @Test void crearVariasPersonasSinDpiNiCorreoNoBuscaDuplicadosVacios() {
        var a=servicio.save(dto(" Ana ","",""));
        var b=servicio.save(dto("Luis","   ",null));
        assertNull(a.getDpi());assertNull(b.getDpi());assertNull(a.getCorreo());assertNull(b.getCorreo());
        assertNull(a.getTelefono());assertEquals("Ana",a.getNombre());
        verify(personas,never()).existsByDpi(any());verify(personas,never()).existsByCorreo(any());
        verify(personas,times(2)).save(any());
    }
    @Test void editarPersonaSinDpiYQuitarDatosOpcionales() {
        Persona existente=new Persona();existente.setIdPersona(1L);existente.setNombre("Ana");existente.setDpi("123");existente.setCorreo("ana@test.com");
        when(personas.findByIdWithRol(1L)).thenReturn(Optional.of(existente));
        var actualizado=servicio.update(1L,dto("Ana López",null,""));
        assertNull(actualizado.getDpi());assertNull(actualizado.getCorreo());
        verify(personas,never()).existsByDpi(any());verify(personas,never()).existsByCorreo(any());
    }
    @Test void unDpiRealDuplicadoConservaSuValidacion() {
        when(personas.existsByDpi("1234567890123")).thenReturn(true);
        assertThrows(IllegalArgumentException.class,()->servicio.save(dto("Ana"," 1234567890123 ",null)));
        verify(personas,never()).save(any());
    }
    @Test void validacionPermiteOpcionalesYExigeNombreYRol() {
        try(var factory=Validation.buildDefaultValidatorFactory()) {
            var validator=factory.getValidator();
            assertTrue(validator.validate(dto("Ana",null,null)).isEmpty());
            var invalido=dto("  ",null,null);invalido.setIdRol(null);
            assertEquals(2,validator.validate(invalido).size());
        }
    }
}
