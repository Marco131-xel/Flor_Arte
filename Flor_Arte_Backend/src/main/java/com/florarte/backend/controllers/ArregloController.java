package com.florarte.backend.controllers;

import com.florarte.backend.dtos.ArregloDTO;
import com.florarte.backend.services.ArregloService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/arreglo")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
public class ArregloController {
    private final ArregloService service;
    public ArregloController(ArregloService service) { this.service=service; }
    @GetMapping("/{id}") public Map<String,Object> detalle(@PathVariable int id) { return service.arreglo(id); }
    @PostMapping("/create") public Map<String,Object> crear(@Valid @RequestBody ArregloDTO dto) { return service.guardarArreglo(null,dto); }
    @PutMapping("/update/{id}")
    @PreAuthorize("@reglasEdicion.editar('arreglos',#id)")
    public Map<String,Object> editar(@PathVariable int id,@Valid @RequestBody ArregloDTO dto) { return service.guardarArreglo(id,dto); }
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("@reglasEdicion.editar('arreglos',#id)")
    public Map<String,String> eliminar(@PathVariable int id) { service.eliminarArreglo(id);return Map.of("message","Arreglo eliminado"); }
}
