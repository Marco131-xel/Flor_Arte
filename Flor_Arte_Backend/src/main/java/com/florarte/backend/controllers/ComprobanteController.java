package com.florarte.backend.controllers;
import com.florarte.backend.services.ComprobanteService;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
@RestController @RequestMapping("/comprobante")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
public class ComprobanteController {
    private final ComprobanteService service;
    public ComprobanteController(ComprobanteService service){this.service=service;}
    public record Emitir(@NotBlank String tipo,@Min(1) int idOrigen){}
    @PostMapping public Map<String,Object> emitir(@Valid @RequestBody Emitir dto){return service.emitir(dto.tipo(),dto.idOrigen());}
    @GetMapping("/{id}") public Map<String,Object> detalle(@PathVariable long id){return service.detalle(id);}
    @GetMapping("/pagina") public Map<String,Object> pagina(@RequestParam(defaultValue="0") int pagina,@RequestParam(defaultValue="10") int tamano,@RequestParam(defaultValue="") String tipo,@RequestParam(defaultValue="") String mes,@RequestParam(defaultValue="") String q){return service.pagina(pagina,tamano,tipo,mes,q);}
}
