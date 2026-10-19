package com.florarte.backend.services;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.util.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

class ComprobantePdfTest {
  static Map<String, Object> comprobante(String tipo, int filas) {
    var lineas = new ArrayList<Map<String, Object>>();
    for (int i = 1; i <= filas; i++)
      lineas.add(
          Map.of(
              "descripcion",
              "Rosas rojas · Línea " + i,
              "cantidad",
              2,
              "precio",
              new BigDecimal("12.50"),
              "subtotal",
              25));
    var datos = new HashMap<String, Object>();
    datos.put(
        "empresa",
        Map.of(
            "nombre",
            "FlorArte",
            "direccion",
            "1 Calle 25-78 Zona1, Quetzaltenango",
            "correo",
            "jadestrella7@gmail.com",
            "telefono",
            "+502 3584 7828"));
    datos.put("persona", "María López");
    datos.put("fecha", "2026-10-12T10:30:00");
    datos.put("estado", "ENTREGADO");
    datos.put("correo", "cliente@example.com");
    datos.put("total", 25 * filas);
    datos.put("lineas", lineas);
    return Map.of(
        "id",
        123,
        "tipo",
        tipo,
        "idOrigen",
        1,
        "emitidoEn",
        "2026-10-12T11:00:00",
        "documento",
        datos);
  }

  @Test
  void tiposConLogoNombreTotalYContenidoReal() throws Exception {
    var service = new ComprobantePdfService();
    for (String tipo : List.of("PEDIDO", "ARREGLO", "EVENTO", "INVENTARIO")) {
      byte[] bytes = service.generar(comprobante(tipo, 1));
      assertTrue(
          new String(bytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-"));
      try (var pdf = Loader.loadPDF(bytes)) {
        String text = new PDFTextStripper().getText(pdf);
        assertTrue(text.contains("María López"));
        assertTrue(text.contains("Q 25.00"));
        assertTrue(text.contains("Rosas rojas"));
        assertTrue(text.contains(tipo));
        assertFalse(text.contains("Estado"));
        assertFalse(text.contains("ENTREGADO"));
        assertTrue(text.contains(tipo.equals("INVENTARIO") ? "COMP-000123" : "REC-000123"));
        boolean logo = false;
        var resources = pdf.getPage(0).getResources();
        for (var name : resources.getXObjectNames())
          if (resources.getXObject(name) instanceof PDImageXObject) logo = true;
        assertTrue(logo);
      }
    }
  }

  @Test
  void reciboGrandeMantieneTodasLasLineasTotalYPaginacion() throws Exception {
    var service = new ComprobantePdfService();
    try (var pdf = Loader.loadPDF(service.generar(comprobante("PEDIDO", 100)))) {
      assertTrue(pdf.getNumberOfPages() > 1);
      String text = new PDFTextStripper().getText(pdf);
      assertTrue(text.contains("Línea 1"));
      assertTrue(text.contains("Línea 100"));
      assertTrue(text.contains("Q 2,500.00"));
      assertTrue(text.contains("TOTAL"));
      assertTrue(text.contains(pdf.getNumberOfPages() + " / " + pdf.getNumberOfPages()));
    }
  }

  @Test
  void copiaHistoricaJsonYCaracteresNoSoportadosNoRompenPdf() throws Exception {
    var source = new HashMap<>(comprobante("EVENTO", 1));
    var datos = new HashMap<>(new ComprobantePdfService().documento(source));
    datos.put("persona", "María 🌸 López");
    source.put("documento", new tools.jackson.databind.json.JsonMapper().writeValueAsString(datos));
    try (var pdf = Loader.loadPDF(new ComprobantePdfService().generar(source))) {
      assertTrue(new PDFTextStripper().getText(pdf).contains("María"));
    }
  }
}
