package com.florarte.backend.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.florarte.backend.exceptions.FlujoAuthException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.*;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

class CorreoServiceTest {
  JavaMailSender sender;
  CorreoService service;
  MimeMessage message;

  @BeforeEach
  void preparar() {
    sender = mock(JavaMailSender.class);
    message = new MimeMessage(Session.getInstance(new Properties()));
    when(sender.createMimeMessage()).thenReturn(message);
    service = new CorreoService(sender, "correo-configurado@example.com");
  }

  @Test
  void codigoUsaHtmlYLogoLocalSinEnviarCorreoReal() throws Exception {
    service.codigo("destinatario@example.com", "012345", false);
    verify(sender).send(message);
    message.saveChanges();
    assertEquals("FlorArte · Código de verificación", message.getSubject());
    assertTrue(message.isMimeType("multipart/related") || message.isMimeType("multipart/mixed"));
    String contenido = html(message);
    assertTrue(contenido.contains("florarte-logo"));
    assertTrue(contenido.contains("012345"));
    assertFalse(contenido.contains("https://fonts"));
  }

  private String html(jakarta.mail.Part part) throws Exception {
    if (part.isMimeType("text/html")) return (String) part.getContent();
    if (part.isMimeType("multipart/*")) {
      var multipart = (jakarta.mail.Multipart) part.getContent();
      StringBuilder result = new StringBuilder();
      for (int i = 0; i < multipart.getCount(); i++) result.append(html(multipart.getBodyPart(i)));
      return result.toString();
    }
    return "";
  }

  @Test
  void errorAutenticacionEsSeguro() {
    doThrow(new MailAuthenticationException("detalle SMTP privado"))
        .when(sender)
        .send(any(MimeMessage.class));
    var ex =
        assertThrows(
            FlujoAuthException.class,
            () -> service.codigo("destinatario@example.com", "012345", false));
    assertEquals(503, ex.status);
    assertEquals("CORREO_AUTENTICACION", ex.codigo);
    assertFalse(ex.getMessage().contains("privado"));
  }

  @Test
  void errorConexionEsSeguro() {
    doThrow(new MailSendException("detalle conexión privado"))
        .when(sender)
        .send(any(MimeMessage.class));
    var ex =
        assertThrows(
            FlujoAuthException.class,
            () -> service.codigo("destinatario@example.com", "012345", false));
    assertEquals(503, ex.status);
    assertEquals("CORREO_NO_DISPONIBLE", ex.codigo);
    assertFalse(ex.getMessage().contains("privado"));
  }

  @Test
  void recuperacionNoExponeFalloSmtpAlSolicitante() {
    doThrow(new MailSendException("detalle SMTP privado"))
        .when(sender)
        .send(any(MimeMessage.class));
    assertDoesNotThrow(
        () ->
            service.recuperacion(
                "destinatario@example.com",
                "https://florarte.example/restablecer-contrasena#token=solo-prueba"));
  }

  @Test
  void credencialesAusentesNoIntentaEnvio() {
    var serviceSinCorreo = new CorreoService(sender, "");
    assertEquals(
        "CORREO_NO_CONFIGURADO",
        assertThrows(
                FlujoAuthException.class,
                () -> serviceSinCorreo.codigo("destinatario@example.com", "012345", false))
            .codigo);
    verify(sender, never()).send(any(MimeMessage.class));
  }

  @Test
  void comprobanteAdjuntaPdfConNombreYEscapaElCliente() throws Exception {
    byte[] pdf = "%PDF-prueba".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
    service.comprobante("cliente@example.com", "María <script>", "REC-000123", pdf);
    message.saveChanges();
    verify(sender).send(message);
    assertTrue(message.getSubject().contains("REC-000123"));
    String contenido = html(message);
    assertTrue(contenido.contains("&lt;script&gt;"));
    assertFalse(contenido.contains("<script>"));
    assertTrue(adjunto(message, pdf));
  }

  private boolean adjunto(jakarta.mail.Part part, byte[] esperado) throws Exception {
    if ("REC-000123.pdf".equals(part.getFileName())) {
      assertTrue(part.isMimeType("application/pdf"));
      assertArrayEquals(esperado, part.getInputStream().readAllBytes());
      return true;
    }
    if (part.isMimeType("multipart/*")) {
      var multi = (jakarta.mail.Multipart) part.getContent();
      for (int i = 0; i < multi.getCount(); i++)
        if (adjunto(multi.getBodyPart(i), esperado)) return true;
    }
    return false;
  }
}
