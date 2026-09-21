package com.florarte.backend.controllers;

import com.florarte.backend.dtos.PedidoDTO;
import com.florarte.backend.services.PedidoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/pedido")
public class PedidoController {

    private final PedidoService pedidoService;

    @Autowired
    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    // Obtener todos los pedidos
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(pedidoService.findAll());
    }

    // Obtener un pedido por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        PedidoDTO pedido = pedidoService.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + id));
        return ResponseEntity.ok(pedido);
    }

    // Crear un nuevo pedido
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> create(@Valid @RequestBody PedidoDTO dto) {
        PedidoDTO nuevo = pedidoService.save(dto);
        return ResponseEntity.ok(Map.of("message", "Pedido creado exitosamente", "pedido", nuevo));
    }

    // Actualizar un pedido
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody PedidoDTO dto) {
        PedidoDTO actualizado = pedidoService.update(id, dto);
        return ResponseEntity.ok(Map.of("message", "Pedido actualizado exitosamente", "pedido", actualizado));
    }

    // Eliminar un pedido
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        pedidoService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Pedido eliminado exitosamente"));
    }
}
