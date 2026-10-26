package com.florarte.backend.controllers;
import com.florarte.backend.services.ReporteService;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/reporte")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class ReporteController {
    private final ReporteService service;
    public ReporteController(ReporteService service){this.service=service;}
    @GetMapping("/exportacion") public Map<String,Object> exportacion(@RequestParam String periodo,@RequestParam String fecha){return service.exportacion(periodo,fecha);}
    @GetMapping("/operativos") public Map<String,Object> operativos(@RequestParam String periodo,@RequestParam String fecha){return service.operativos(periodo,fecha);}
    @GetMapping("/financieros") public Map<String,Object> financieros(@RequestParam String periodo,@RequestParam String fecha){return service.financieros(periodo,fecha);}
    @GetMapping("/mermas/pagina") public Map<String,Object> mermas(@RequestParam String periodo,@RequestParam String fecha,
        @RequestParam(defaultValue="0") int pagina,@RequestParam(defaultValue="10") int tamano){return service.mermas(periodo,fecha,pagina,tamano);}
}
