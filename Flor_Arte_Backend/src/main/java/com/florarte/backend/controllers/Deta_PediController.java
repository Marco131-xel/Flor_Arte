package com.florarte.backend.controllers;

import com.florarte.backend.dtos.Deta_PediDTO;
import com.florarte.backend.services.Deta_PediService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/detalle_pedido")
public class Deta_PediController {

    private final Deta_PediService detaPediService;

    @Autowired
    public Deta_PediController(Deta_PediService detaPediService) {
        this.detaPediService = detaPediService;
    }

    // Obtener todos los detalles de pedidos
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(detaPediService.findAll());
    }

    // Obtener un detalle de pedido por id
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping({"/show/{id}", "/{id}"})
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        Deta_PediDTO detalle = detaPediService.findById(id)
                .orElseThrow(() -> new RuntimeException("Detalle de pedido no encontrado con id: " + id));
        return ResponseEntity.ok(detalle);
    }

    // Obtener detalles por id de pedido
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @GetMapping("/pedido/{idPedido}")
    public ResponseEntity<?> getByPedido(@PathVariable Integer idPedido) {
        return ResponseEntity.ok(detaPediService.findByPedido(idPedido));
    }

    // Crear un detalle de pedido (descuenta stock y registra salida venta)
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PostMapping("/create")
    public ResponseEntity<?> create(@Valid @RequestBody Deta_PediDTO dto) {
        Deta_PediDTO nuevo = detaPediService.save(dto);
        return ResponseEntity.ok(Map.of("message", "Detalle de pedido creado exitosamente", "detalle", nuevo));
    }

    // Actualizar un detalle de pedido
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @PutMapping({"/update/{id}", "/{id}"})
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody Deta_PediDTO dto) {
        Deta_PediDTO actualizado = detaPediService.update(id, dto);
        return ResponseEntity.ok(Map.of("message", "Detalle de pedido actualizado exitosamente", "detalle", actualizado));
    }

    // Eliminar un detalle de pedido (restituye stock)
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
    @DeleteMapping({"/delete/{id}", "/{id}"})
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        detaPediService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Detalle de pedido eliminado exitosamente"));
    }
}
