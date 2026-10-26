package com.florarte.backend.services;

import com.florarte.backend.dtos.UpdatePedidoCompletoDTO;
import com.florarte.backend.entities.*;
import com.florarte.backend.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PedidoCompletoTest {
    PedidoRepository pedidos = mock(PedidoRepository.class);
    PersonaRepository personas = mock(PersonaRepository.class);
    Deta_PediRepository detalles = mock(Deta_PediRepository.class);
    FlorRepository flores = mock(FlorRepository.class);
    Mov_InvRepository movimientos = mock(Mov_InvRepository.class);
    PedidoService servicio = new PedidoService(pedidos, personas, detalles, flores, movimientos);
    Pedido pedido;
    Flor flor;
    Detalle_Pedido original;

    @BeforeEach void preparar() {
        pedido = new Pedido(); pedido.setIdPedido(1); pedido.setEstado("PENDIENTE");
        flor = new Flor(); flor.setIdFlor(10); flor.setStock(5);
        original = new Detalle_Pedido(); original.setIdDetallePedido(20);
        original.setIdPedido(1); original.setIdFlor(10); original.setCantidad(3);
        original.setPrecio(new BigDecimal("2.00")); original.setSubtotal(new BigDecimal("6.00"));
        Persona persona = new Persona(); persona.setNombre("Cliente");
        when(pedidos.findById(1)).thenReturn(Optional.of(pedido));
        when(personas.findById(1L)).thenReturn(Optional.of(persona));
        when(detalles.findByIdPedido(1)).thenReturn(List.of(original));
        when(flores.findByIdWithDetails(10)).thenReturn(Optional.of(flor));
        when(detalles.save(any())).thenAnswer(i -> i.getArgument(0));
    }
    UpdatePedidoCompletoDTO entrada(String estado, int cantidad) {
        return new UpdatePedidoCompletoDTO(1L, null, estado, List.of(
                new UpdatePedidoCompletoDTO.Item(20, 10, cantidad, new BigDecimal("2.00"))));
    }
    @Test void actualizarCalculaDiferenciaYTotal() {
        var resultado = servicio.updateCompleto(1, entrada("CONFIRMADO", 5));
        assertEquals(3, flor.getStock());
        assertEquals(new BigDecimal("10.00"), resultado.getTotal());
        assertEquals("CONFIRMADO", resultado.getEstado());
        assertEquals(20, resultado.getDetalles().getFirst().getIdDetallePedido());
        verify(movimientos).save(argThat(m -> m.getCantidad() == 2 && m.getTipoMovimiento().equals("SALIDA")));
    }
    @Test void cancelarDevuelveSoloLoReservadoOriginalmente() {
        servicio.updateCompleto(1, entrada("CANCELADO", 20));
        assertEquals(8, flor.getStock());
        verify(movimientos).save(argThat(m -> m.getCantidad() == 3 && m.getTipoMovimiento().equals("ENTRADA")));
    }
    @Test void editarCanceladoNoModificaStock() {
        pedido.setEstado("CANCELADO");
        servicio.updateCompleto(1, entrada("CANCELADO", 20));
        assertEquals(5, flor.getStock());
        verify(flores, never()).save(any());
        verifyNoInteractions(movimientos);
    }
    @Test void reactivarDescuentaNuevaCantidad() {
        pedido.setEstado("CANCELADO");
        servicio.updateCompleto(1, entrada("PENDIENTE", 4));
        assertEquals(1, flor.getStock());
    }
    @Test void stockInsuficienteNoEscribe() {
        assertThrows(IllegalArgumentException.class, () -> servicio.updateCompleto(1, entrada("PENDIENTE", 9)));
        verify(flores, never()).save(any()); verify(detalles, never()).save(any());
        verify(pedidos, never()).save(any()); verifyNoInteractions(movimientos);
    }
    @Test void rechazaDetallesAjenosYFloresDuplicadas() {
        var ajeno = new UpdatePedidoCompletoDTO.Item(999, 10, 2, BigDecimal.ONE);
        assertThrows(IllegalArgumentException.class, () -> servicio.updateCompleto(1,
                new UpdatePedidoCompletoDTO(1L, null, "PENDIENTE", List.of(ajeno))));
        var item = entrada("PENDIENTE", 2).detalles().getFirst();
        assertThrows(IllegalArgumentException.class, () -> servicio.updateCompleto(1,
                new UpdatePedidoCompletoDTO(1L, null, "PENDIENTE", List.of(item, item))));
        verifyNoInteractions(movimientos);
    }
    @Test void eliminaYAgregaEnElMismoGuardado() {
        Flor nueva = new Flor(); nueva.setIdFlor(11); nueva.setStock(10);
        when(flores.findByIdWithDetails(11)).thenReturn(Optional.of(nueva));
        var item = new UpdatePedidoCompletoDTO.Item(null, 11, 4, new BigDecimal("3.00"));
        var resultado = servicio.updateCompleto(1,
                new UpdatePedidoCompletoDTO(1L, null, "PENDIENTE", List.of(item)));
        assertEquals(8, flor.getStock()); assertEquals(6, nueva.getStock());
        assertEquals(new BigDecimal("12.00"), resultado.getTotal());
        verify(detalles).delete(original);
    }
    @Test void falloAlGuardarActivaRollbackDeLaTransaccion() {
        PlatformTransactionManager manager = mock(PlatformTransactionManager.class);
        TransactionStatus status = mock(TransactionStatus.class);
        when(manager.getTransaction(any(TransactionDefinition.class))).thenReturn(status);
        ProxyFactory factory = new ProxyFactory(servicio);
        factory.addAdvice(new TransactionInterceptor(manager, new AnnotationTransactionAttributeSource()));
        PedidoService proxy = (PedidoService) factory.getProxy();
        when(pedidos.save(any())).thenThrow(new IllegalStateException("Fallo simulado al guardar cabecera"));
        assertThrows(IllegalStateException.class, () -> proxy.updateCompleto(1, entrada("CONFIRMADO", 5)));
        verify(detalles).save(any());
        verify(manager).rollback(status);
        verify(manager, never()).commit(any());
    }
}
