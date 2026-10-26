package com.florarte.backend.services;

import com.florarte.backend.exceptions.FlujoAuthException;
import java.awt.Color;
import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

/** Genera el adjunto exclusivamente desde la copia histórica del servidor. */
@Service
public class ComprobantePdfService {
  private static final Color OLIVA = new Color(121, 125, 17),
      VERDE = new Color(47, 111, 94),
      TINTA = new Color(55, 65, 48),
      BORDE = new Color(215, 223, 194);
  private final JsonMapper mapper = JsonMapper.builder().build();

  @SuppressWarnings("unchecked")
  public Map<String, Object> documento(Map<String, Object> comprobante) {
    var value = comprobante.get("documento");
    return value instanceof String json
        ? mapper.readValue(json, Map.class)
        : (Map<String, Object>) value;
  }

  public String numero(Map<String, Object> comprobante) {
    return ("INVENTARIO".equals(comprobante.get("tipo")) ? "COMP-" : "REC-")
        + String.format(Locale.ROOT, "%06d", ((Number) comprobante.get("id")).longValue());
  }

  private static String texto(Object value) {
    return value == null ? "" : value.toString();
  }

  private static String dinero(Object value) {
    return "Q " + String.format(Locale.US, "%,.2f", new BigDecimal(value.toString()));
  }

  private static String fecha(Object value) {
    try {
      return LocalDateTime.parse(texto(value))
          .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    } catch (Exception e) {
      return texto(value);
    }
  }

  public byte[] generar(Map<String, Object> comprobante) {
    var d = documento(comprobante);
    String numero = numero(comprobante);
    String tipo = texto(comprobante.get("tipo"));
    try (var doc = new PDDocument();
        var output = new ByteArrayOutputStream();
        var regular = new ClassPathResource("pdf/Inter-Regular.ttf").getInputStream();
        var medium = new ClassPathResource("pdf/Inter-Medium.ttf").getInputStream()) {
      var font = PDType0Font.load(doc, regular);
      var bold = PDType0Font.load(doc, medium);
      var logo =
          PDImageXObject.createFromByteArray(
              doc, new ClassPathResource("mail/florarte.png").getContentAsByteArray(), "FlorArte");
      try (var layout = new Paginas(doc, font, bold, logo, numero, tipo, d)) {
        layout.parrafo(
            "Emisión: "
                + fecha(comprobante.get("emitidoEn"))
                + " · Origen: "
                + texto(comprobante.get("tipo"))
                + " #"
                + comprobante.get("idOrigen"),
            9);
        layout.cliente("INVENTARIO".equals(tipo));
        layout.y -= 12;
        layout.tabla();
        for (Object value : (List<?>) d.get("lineas")) {
          @SuppressWarnings("unchecked")
          var linea = (Map<String, Object>) value;
          layout.fila(linea);
        }
        layout.espacio(125);
        layout.y -= 18;
        layout.stream.setStrokingColor(BORDE);
        layout.stream.moveTo(42, layout.y + 5);
        layout.stream.lineTo(553, layout.y + 5);
        layout.stream.stroke();
        layout.escribir("IMPORTE TOTAL", 42, layout.y - 18, 10, bold, VERDE);
        layout.derecha(dinero(d.get("total")), 539, layout.y - 18, 14, bold, VERDE);
        layout.y -= 60;
        layout.parrafo(
            "INVENTARIO".equals(tipo)
                ? "Detalle de la compra registrada en inventario."
                : "Gracias por confiar en FlorArte.",
            10);
        layout.parrafo("Documento de la operación registrada. No confirma por sí solo el pago.", 8);
        layout.y -= 17;
        layout.stream.setStrokingColor(BORDE);
        layout.stream.moveTo(42, layout.y);
        layout.stream.lineTo(230, layout.y);
        layout.stream.moveTo(365, layout.y);
        layout.stream.lineTo(553, layout.y);
        layout.stream.stroke();
        layout.escribir("Entregado por", 42, layout.y - 14, 8, font, TINTA);
        layout.escribir("Recibido por", 365, layout.y - 14, 8, font, TINTA);
      }
      int total = doc.getNumberOfPages();
      for (int i = 0; i < total; i++) {
        try (var stream =
            new PDPageContentStream(
                doc, doc.getPage(i), PDPageContentStream.AppendMode.APPEND, true, true)) {
          stream.setStrokingColor(BORDE);
          stream.moveTo(42, 43);
          stream.lineTo(553, 43);
          stream.stroke();
          stream.beginText();
          stream.setFont(font, 8);
          stream.setNonStrokingColor(TINTA);
          stream.newLineAtOffset(42, 28);
          stream.showText("FlorArte · " + numero + " · Documento emitido por FlorArte");
          stream.endText();
          String pagina = (i + 1) + " / " + total;
          stream.beginText();
          stream.setFont(font, 8);
          stream.newLineAtOffset(553 - font.getStringWidth(pagina) * 8 / 1000, 28);
          stream.showText(pagina);
          stream.endText();
        }
      }
      doc.getDocumentInformation().setTitle("FlorArte · " + numero);
      doc.save(output);
      return output.toByteArray();
    } catch (IOException | IllegalArgumentException e) {
      throw new FlujoAuthException(
          503, "PDF_NO_DISPONIBLE", "No se pudo generar el PDF. Intenta nuevamente.");
    }
  }

  private static final class Paginas implements AutoCloseable {
    final PDDocument doc;
    final PDType0Font font, bold;
    final PDImageXObject logo;
    final String numero, tipo;
    final Map<String, Object> datos;
    PDPageContentStream stream;
    float y;
    int filaNumero;

    Paginas(
        PDDocument doc,
        PDType0Font font,
        PDType0Font bold,
        PDImageXObject logo,
        String numero,
        String tipo,
        Map<String, Object> datos)
        throws IOException {
      this.doc = doc;
      this.font = font;
      this.bold = bold;
      this.logo = logo;
      this.numero = numero;
      this.tipo = tipo;
      this.datos = datos;
      nueva();
    }

    @SuppressWarnings("unchecked")
    void nueva() throws IOException {
      if (stream != null) stream.close();
      var page = new PDPage(PDRectangle.A4);
      doc.addPage(page);
      stream = new PDPageContentStream(doc, page);
      float alto = PDRectangle.A4.getHeight();
      stream.setNonStrokingColor(OLIVA);
      stream.addRect(0, alto - 8, PDRectangle.A4.getWidth(), 8);
      stream.fill();
      stream.drawImage(logo, 42, alto - 106, 65, 65);
      var empresa = (Map<String, Object>) datos.get("empresa");
      escribir(texto(empresa.get("nombre")), 123, alto - 49, 24, bold, VERDE);
      float empresaY = alto - 67;
      for (String line : lineas(texto(empresa.get("direccion")), 252, font, 8)) {
        escribir(line, 123, empresaY, 8, font, TINTA);
        empresaY -= 11;
      }
      escribir(texto(empresa.get("telefono")), 123, empresaY, 8, font, TINTA);
      empresaY -= 11;
      for (String line : lineas(texto(empresa.get("correo")), 252, font, 8)) {
        escribir(line, 123, empresaY, 8, font, TINTA);
        empresaY -= 11;
      }
      derecha("NÚMERO DE DOCUMENTO", 553, alto - 57, 7, font, TINTA);
      derecha(numero, 553, alto - 79, 12, bold, VERDE);
      stream.setStrokingColor(new Color(201, 162, 39));
      stream.moveTo(42, alto - 126);
      stream.lineTo(553, alto - 126);
      stream.stroke();
      String titulo =
          switch (tipo) {
            case "PEDIDO" -> "Recibo de pedido";
            case "ARREGLO" -> "Recibo de arreglo";
            case "EVENTO" -> "Recibo de evento";
            default -> "Comprobante de compra";
          };
      escribir(titulo, 42, alto - 151, 15, bold, VERDE);
      y = alto - 173;
    }

    void cliente(boolean proveedor) throws IOException {
      var nombre = lineas(texto(datos.get("persona")), 483, bold, 12);
      var detalles = new ArrayList<String>();
      detalles.add("Fecha de la operación: " + fecha(datos.get("fecha")));
      for (String campo : List.of("telefono", "correo", "responsable"))
        if (!texto(datos.get(campo)).isBlank())
          detalles.add(
              switch (campo) {
                    case "telefono" -> "Teléfono: ";
                    case "correo" -> "Correo: ";
                    default -> "Atendido por: ";
                  }
                  + texto(datos.get(campo)));
      var filas = new ArrayList<String>();
      for (String detalle : detalles) filas.addAll(lineas(detalle, 483, font, 9));
      float height = 41 + nombre.size() * 16 + filas.size() * 14;
      y -= 8;
      espacio(height + 10);
      stream.setNonStrokingColor(new Color(245, 247, 237));
      stream.addRect(42, y - height + 10, 511, height);
      stream.fill();
      escribir(proveedor ? "DATOS DEL PROVEEDOR" : "DATOS DEL CLIENTE", 56, y - 9, 8, bold, OLIVA);
      float baseline = y - 31;
      for (String line : nombre) {
        escribir(line, 56, baseline, 12, bold, TINTA);
        baseline -= 16;
      }
      baseline -= 3;
      for (String line : filas) {
        escribir(line, 56, baseline, 9, font, TINTA);
        baseline -= 14;
      }
      y -= height + 6;
    }

    String seguro(String text) {
      var result = new StringBuilder();
      text.codePoints()
          .forEach(
              cp -> {
                if (Character.isISOControl(cp)) {
                  result.append(' ');
                  return;
                }
                try {
                  font.encode(new String(Character.toChars(cp)));
                  result.appendCodePoint(cp);
                } catch (IOException | IllegalArgumentException ex) {
                  result.append('?');
                }
              });
      return result.toString();
    }

    void escribir(String text, float x, float baseline, float size, PDFont face, Color color)
        throws IOException {
      stream.beginText();
      stream.setFont(face, size);
      stream.setNonStrokingColor(color);
      stream.newLineAtOffset(x, baseline);
      stream.showText(seguro(text));
      stream.endText();
    }

    void derecha(String text, float x, float baseline, float size, PDFont face, Color color)
        throws IOException {
      text = seguro(text);
      escribir(text, x - face.getStringWidth(text) * size / 1000, baseline, size, face, color);
    }

    List<String> lineas(String text, float width, PDFont face, float size) throws IOException {
      var result = new ArrayList<String>();
      StringBuilder line = new StringBuilder();
      for (int cp : seguro(text).codePoints().toArray()) {
        String candidate = line.toString() + new String(Character.toChars(cp));
        if (face.getStringWidth(candidate) * size / 1000 > width && !line.isEmpty()) {
          int corte = line.lastIndexOf(" ");
          if (corte > 0) {
            result.add(line.substring(0, corte).strip());
            String resto = line.substring(corte + 1);
            line.setLength(0);
            line.append(resto);
          } else {
            result.add(line.toString().strip());
            line.setLength(0);
          }
        }
        if (cp != ' ' || !line.isEmpty()) line.appendCodePoint(cp);
      }
      if (!line.isEmpty()) result.add(line.toString().strip());
      if (result.isEmpty()) result.add("");
      return result;
    }

    void espacio(float height) throws IOException {
      if (y - height < 65) nueva();
    }

    void parrafo(String text, float size) throws IOException {
      for (String line : lineas(text, 511, font, size)) {
        espacio(size + 7);
        escribir(line, 42, y, size, font, TINTA);
        y -= size + 7;
      }
    }

    void tabla() throws IOException {
      espacio(30);
      stream.setNonStrokingColor(OLIVA);
      stream.addRect(42, y - 14, 511, 26);
      stream.fill();
      escribir("Cantidad", 48, y - 4, 9, bold, Color.WHITE);
      escribir("Descripción", 108, y - 4, 9, bold, Color.WHITE);
      derecha("Precio unitario", 452, y - 4, 9, bold, Color.WHITE);
      derecha("Subtotal", 545, y - 4, 9, bold, Color.WHITE);
      y -= 31;
    }

    void fila(Map<String, Object> linea) throws IOException {
      var desc = lineas(texto(linea.get("descripcion")), 246, font, 9);
      float height = Math.max(22, desc.size() * 13 + 9);
      if (y - height < 65) {
        nueva();
        tabla();
      }
      stream.setNonStrokingColor(filaNumero++ % 2 == 0 ? new Color(247, 249, 240) : Color.WHITE);
      stream.addRect(42, y - height + 7, 511, height);
      stream.fill();
      escribir(texto(linea.get("cantidad")), 48, y - 5, 9, font, TINTA);
      float baseline = y - 5;
      for (String line : desc) {
        escribir(line, 108, baseline, 9, font, TINTA);
        baseline -= 13;
      }
      derecha(dinero(linea.get("precio")), 452, y - 5, 9, font, TINTA);
      derecha(dinero(linea.get("subtotal")), 545, y - 5, 9, font, TINTA);
      stream.setStrokingColor(BORDE);
      stream.moveTo(42, y - height + 7);
      stream.lineTo(553, y - height + 7);
      stream.stroke();
      y -= height + 2;
    }

    public void close() throws IOException {
      if (stream != null) stream.close();
    }
  }
}
