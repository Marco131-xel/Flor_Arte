package com.florarte.backend.controllers;

import com.florarte.backend.dtos.PedidoArregloDTO;
import com.florarte.backend.dtos.EstadoPedidoDTO;
import com.florarte.backend.services.ArregloService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pedido_arreglo")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
public class PedidoArregloController {
    private final ArregloService service;
    public PedidoArregloController(ArregloService service) { this.service=service; }
    @GetMapping("/{id}") public Map<String,Object> detalle(@PathVariable int id) { return service.pedido(id); }
    @PostMapping("/create") public Map<String,Object> crear(@Valid @RequestBody PedidoArregloDTO dto) { return service.guardarPedido(null,dto); }
    @PutMapping("/update/{id}")
    @PreAuthorize("@reglasEdicion.editar('pedidosArreglos',#id)")
    public Map<String,Object> editar(@PathVariable int id,@Valid @RequestBody PedidoArregloDTO dto) { return service.guardarPedido(id,dto); }
    @PutMapping("/{id}/estado") public Map<String,Object> estado(@PathVariable int id,@Valid @RequestBody EstadoPedidoDTO dto) { return service.estado(id,dto.estado()); }
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("@reglasEdicion.editar('pedidosArreglos',#id)")
    public Map<String,String> eliminar(@PathVariable int id) { service.eliminarPedido(id);return Map.of("message","Pedido de arreglo eliminado"); }
}
