package com.florarte.backend.controllers;

import com.florarte.backend.dtos.EstadoPedidoDTO;
import com.florarte.backend.dtos.PedidoDTO;
import com.florarte.backend.services.PedidoService;
import com.florarte.backend.services.ReglasEdicion;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PedidoEstadoPermisosTest {
    @Configuration @EnableMethodSecurity static class Seguridad {}
    @Test void empleadoCambiaEstadoFueraDelPlazoPeroNoDatosNiElimina() {
        var servicio=mock(PedidoService.class);
        var reglas=mock(ReglasEdicion.class);
        when(reglas.editar("pedidos",1)).thenReturn(false);
        when(servicio.updateEstado(1,"CONFIRMADO")).thenReturn(new PedidoDTO());
        try(var contexto=new AnnotationConfigApplicationContext()) {
            contexto.register(Seguridad.class);
            contexto.registerBean("reglasEdicion",ReglasEdicion.class,()->reglas);
            contexto.registerBean(PedidoService.class,()->servicio);
            contexto.registerBean(PedidoController.class);contexto.refresh();
            SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("empleado","", "ROLE_EMPLEADO"));
            var controller=contexto.getBean(PedidoController.class);
            assertEquals(200,controller.updateEstado(1,new EstadoPedidoDTO("CONFIRMADO")).getStatusCode().value());
            verify(servicio).updateEstado(1,"CONFIRMADO");
            assertThrows(AccessDeniedException.class,()->controller.update(1,new PedidoDTO()));
            assertThrows(AccessDeniedException.class,()->controller.updateCompleto(1,null));
            assertThrows(AccessDeniedException.class,()->controller.delete(1));
            verifyNoMoreInteractions(servicio);
            SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("cliente","", "ROLE_CLIENTE"));
            assertThrows(AccessDeniedException.class,()->controller.updateEstado(1,new EstadoPedidoDTO("CONFIRMADO")));
        } finally {SecurityContextHolder.clearContext();}
    }
    @Test void estadoObligatorioYValoresValidos() {
        try(var factory=Validation.buildDefaultValidatorFactory()) {
            var validator=factory.getValidator();
            assertTrue(validator.validate(new EstadoPedidoDTO("CONFIRMADO")).isEmpty());
            assertFalse(validator.validate(new EstadoPedidoDTO(null)).isEmpty());
            assertFalse(validator.validate(new EstadoPedidoDTO("OTRO")).isEmpty());
        }
    }
}
