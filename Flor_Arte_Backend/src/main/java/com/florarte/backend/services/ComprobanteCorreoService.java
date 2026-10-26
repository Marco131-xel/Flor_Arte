package com.florarte.backend.services;

import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ComprobanteCorreoService {
  private final ComprobanteService comprobantes;
  private final ComprobantePdfService pdf;
  private final CorreoService correo;
  private final LimiteAuthService limite;

  public ComprobanteCorreoService(
      ComprobanteService comprobantes,
      ComprobantePdfService pdf,
      CorreoService correo,
      LimiteAuthService limite) {
    this.comprobantes = comprobantes;
    this.pdf = pdf;
    this.correo = correo;
    this.limite = limite;
  }

  public Map<String, String> enviar(long id, String destinatario, String usuario) {
    var comprobante = comprobantes.detalle(id);
    limite.consumir("recibo-correo-usuario:" + usuario, 30, 900);
    limite.consumir("recibo-correo-documento:" + id, 3, 900);
    var documento = pdf.documento(comprobante);
    correo.comprobante(
        destinatario.strip(),
        String.valueOf(documento.get("persona")),
        pdf.numero(comprobante),
        pdf.generar(comprobante));
    return Map.of("message", "El comprobante PDF fue enviado al correo indicado.");
  }
}
