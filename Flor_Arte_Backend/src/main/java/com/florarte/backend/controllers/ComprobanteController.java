package com.florarte.backend.controllers;

import com.florarte.backend.services.ComprobanteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comprobante")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','EMPLEADO')")
public class ComprobanteController {
  private final ComprobanteService service;
  private final com.florarte.backend.services.ComprobantePdfService pdf;
  private final com.florarte.backend.services.ComprobanteCorreoService correo;

  public ComprobanteController(
      ComprobanteService service,
      com.florarte.backend.services.ComprobanteCorreoService correo,
      com.florarte.backend.services.ComprobantePdfService pdf) {
    this.service = service;
    this.correo = correo;
    this.pdf = pdf;
  }

  public record Emitir(@NotBlank String tipo, @Min(1) int idOrigen) {}

  @PostMapping
  public Map<String, Object> emitir(@Valid @RequestBody Emitir dto) {
    return service.emitir(dto.tipo(), dto.idOrigen());
  }

  public record EnviarCorreo(@NotBlank @Email @Size(max = 150) String correo) {}

  @PostMapping("/{id}/correo")
  public Map<String, String> enviar(
      @PathVariable long id,
      @Valid @RequestBody EnviarCorreo dto,
      java.security.Principal principal) {
    return correo.enviar(id, dto.correo(), principal.getName());
  }

  @GetMapping("/{id}")
  public Map<String, Object> detalle(@PathVariable long id) {
    return service.detalle(id);
  }

  @GetMapping(value = "/{id}/pdf", produces = "application/pdf")
  public org.springframework.http.ResponseEntity<byte[]> descargar(@PathVariable long id) {
    var comprobante = service.detalle(id);
    return org.springframework.http.ResponseEntity.ok()
        .header(
            "Content-Disposition", "attachment; filename=\"" + pdf.numero(comprobante) + ".pdf\"")
        .header("Cache-Control", "no-store")
        .body(pdf.generar(comprobante));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("@reglasEdicion.editar('comprobantes', #id)")
  public org.springframework.http.ResponseEntity<Void> eliminar(@PathVariable long id) {
    service.eliminar(id);
    return org.springframework.http.ResponseEntity.noContent().build();
  }

  @GetMapping("/pagina")
  public Map<String, Object> pagina(
      @RequestParam(defaultValue = "0") int pagina,
      @RequestParam(defaultValue = "10") int tamano,
      @RequestParam(defaultValue = "") String tipo,
      @RequestParam(defaultValue = "") String mes,
      @RequestParam(defaultValue = "") String q) {
    return service.pagina(pagina, tamano, tipo, mes, q);
  }
}
