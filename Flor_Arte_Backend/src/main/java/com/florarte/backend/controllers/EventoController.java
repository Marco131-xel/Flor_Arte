package com.florarte.backend.controllers;

import com.florarte.backend.services.EventoService;
import com.florarte.backend.dtos.*;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/evento")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
public class EventoController {
    private final EventoService service;
    public EventoController(EventoService service){this.service=service;}
    @GetMapping("/{id}") public Map<String,Object> detalle(@PathVariable int id){return service.detalle(id);}
    @PostMapping("/create") public Map<String,Object> crear(@Valid @RequestBody EventoDTO dto){return service.guardar(null,dto);}
    @PutMapping("/update/{id}") @PreAuthorize("@reglasEdicion.editar('eventos',#id)")
    public Map<String,Object> editar(@PathVariable int id,@Valid @RequestBody EventoDTO dto){return service.guardar(id,dto);}
    @DeleteMapping("/delete/{id}") @PreAuthorize("@reglasEdicion.editar('eventos',#id)")
    public Map<String,String> eliminar(@PathVariable int id){service.eliminar(id);return Map.of("message","Evento eliminado");}
    @PutMapping("/{id}/estado") public Map<String,Object> estado(@PathVariable int id,@Valid @RequestBody EstadoEventoDTO dto){return service.estado(id,dto.estado(),dto.importe());}
    @GetMapping("/calendario") public Map<String,Object> calendario(@RequestParam int anio,@RequestParam int mes,
        @RequestParam(defaultValue="") String estado,@RequestParam(defaultValue="") String q){return service.calendario(anio,mes,estado,q);}
    @GetMapping("/pagina") public Map<String,Object> pagina(@RequestParam int anio,@RequestParam(defaultValue="0") int mes,
        @RequestParam(defaultValue="") String dia,@RequestParam(defaultValue="") String estado,@RequestParam(defaultValue="") String q,
        @RequestParam(defaultValue="0") int pagina,@RequestParam(defaultValue="10") int tamano,
        @RequestParam(defaultValue="false") boolean preparacion){return service.pagina(anio,mes,dia,estado,q,pagina,tamano,preparacion);}
}
