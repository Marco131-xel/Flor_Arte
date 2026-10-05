package com.florarte.backend.services;

import com.florarte.backend.dtos.Movimiento_InventarioDTO;
import com.florarte.backend.entities.*;
import com.florarte.backend.repositories.*;
import java.util.Optional;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MermaStockTest {
    FlorRepository flores; Mov_InvRepository movimientos; Mov_InvService servicio; Flor flor;
    @BeforeEach void preparar() {
        flores=mock(FlorRepository.class); movimientos=mock(Mov_InvRepository.class);
        servicio=new Mov_InvService(movimientos,flores);
        flor=new Flor(); flor.setIdFlor(1); flor.setStock(7);
        var merma=new Movimiento_Inventario(); merma.setIdMovimientoInventario(1); merma.setIdFlor(1);
        merma.setTipoMovimiento("SALIDA"); merma.setMotivo("MERMA"); merma.setCantidad(3);
        when(flores.findByIdWithDetails(1)).thenReturn(Optional.of(flor));
        when(movimientos.findByIdWithFlor(1)).thenReturn(Optional.of(merma));
        when(movimientos.save(any())).thenAnswer(i->i.getArgument(0));
    }
    Movimiento_InventarioDTO dto(int cantidad) {
        var dto=new Movimiento_InventarioDTO(); dto.setIdFlor(1);dto.setCantidad(cantidad);
        dto.setTipoMovimiento("SALIDA");dto.setMotivo("MERMA");return dto;
    }
    @Test void editarAplicaSoloLaDiferencia() {
        servicio.update(1,dto(5));assertEquals(5,flor.getStock());verify(flores).save(flor);
    }
    @Test void eliminarRestituyeExistencias() {
        servicio.deleteById(1);assertEquals(10,flor.getStock());verify(movimientos).deleteById(1);
    }
    @Test void noPermiteStockNegativo() {
        assertThrows(IllegalArgumentException.class,()->servicio.update(1,dto(11)));
        assertEquals(7,flor.getStock());verify(flores,never()).save(any());verify(movimientos,never()).save(any());
    }
}
