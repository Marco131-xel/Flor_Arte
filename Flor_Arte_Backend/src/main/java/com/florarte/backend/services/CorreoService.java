package com.florarte.backend.services;

import com.florarte.backend.exceptions.FlujoAuthException;
import java.nio.charset.StandardCharsets;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.*;
import org.springframework.mail.javamail.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class CorreoService {
  private final JavaMailSender sender;
  private final String from;
  private static final Logger log = LoggerFactory.getLogger(CorreoService.class);

  public CorreoService(JavaMailSender sender, @Value("${florarte.mail.from}") String from) {
    this.sender = sender;
    this.from = from;
  }

  private String plantilla(String titulo, String contenido) {
    return plantilla(titulo, contenido, true);
  }

  private String plantilla(String titulo, String contenido, boolean seguridad) {
    return "<!doctype html><html lang='es'><head><meta charset='UTF-8'><meta name='viewport'"
               + " content='width=device-width,initial-scale=1'></head><body"
               + " style='margin:0;background:#fbf9f4;font-family:Arial,sans-serif;color:#293a2b'><table"
               + " role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr><td"
               + " style='padding:24px 12px'><table role='presentation' width='100%'"
               + " style='max-width:560px;margin:auto;background:white;border:1px solid"
               + " #d7dfc2;border-radius:16px;overflow:hidden'><tr><td"
               + " style='background:#797d11;color:white;padding:24px'><table role='presentation'"
               + " cellpadding='0' cellspacing='0' width='100%'><tr><td width='88' valign='middle'"
               + " style='vertical-align:middle;padding-right:16px'><img src='cid:florarte-logo'"
               + " width='72' height='72' alt='FlorArte'"
               + " style='display:block;width:72px;height:72px;object-fit:contain'></td><td"
               + " valign='middle'"
               + " style='vertical-align:middle;color:white;font-family:Georgia,serif;font-size:27px;line-height:1.2'>FlorArte<span"
               + " style='font-size:12px;display:block;margin-top:7px;line-height:1.5'>Gestión que"
               + " florece</span></td></tr></table></td></tr><tr><td style='padding:28px'><h1"
               + " style='font-size:21px;color:#2f6f5e;margin:0 0 20px'>"
        + HtmlUtils.htmlEscape(titulo)
        + "</h1>"
        + contenido
        + "<p style='font-size:13px;color:#687650;line-height:1.6'>"
        + (seguridad
            ? "Si no solicitaste esta acción, ignora este correo. Nunca compartas contraseñas ni"
                + " códigos con otras personas."
            : "Si tienes alguna consulta sobre este documento, comunícate con FlorArte por los"
                + " medios indicados abajo.")
        + "</p></td></tr><tr><td style='padding:20px;background:#f2f5e7;border-top:2px"
        + " solid #c9a227;color:#667558;font-size:12px'>FlorArte · 1 Calle 25-78 Zona1,"
        + " Quetzaltenango<br>+502 3584 7828 ·"
        + " jadestrella7@gmail.com</td></tr></table></td></tr></table></body></html>";
  }

  public void enviar(String destinatario, String asunto, String html) {
    enviarMensaje(destinatario, asunto, html, null, null);
  }

  private void enviarMensaje(
      String destinatario, String asunto, String html, byte[] adjunto, String nombreArchivo) {
    if (from.isBlank())
      throw new FlujoAuthException(
          503,
          "CORREO_NO_CONFIGURADO",
          "El envío de correo no está configurado. Contacta al administrador.");
    try {
      var message = sender.createMimeMessage();
      var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
      helper.setFrom(from, "FlorArte");
      helper.setTo(destinatario);
      helper.setSubject(asunto);
      helper.setText(html, true);
      if (html.contains("cid:florarte-logo"))
        helper.addInline(
            "florarte-logo",
            new org.springframework.core.io.ClassPathResource("mail/florarte.png"),
            "image/png");
      if (adjunto != null)
        helper.addAttachment(
            nombreArchivo,
            new org.springframework.core.io.ByteArrayResource(adjunto),
            "application/pdf");
      sender.send(message);
    } catch (MailAuthenticationException e) {
      log.warn("Envío SMTP rechazado: autenticación");
      throw new FlujoAuthException(
          503, "CORREO_AUTENTICACION", "No se pudo enviar el correo. Contacta al administrador.");
    } catch (Exception e) {
      log.warn("Envío SMTP fallido: conexión o entrega");
      throw new FlujoAuthException(
          503, "CORREO_NO_DISPONIBLE", "No se pudo enviar el correo. Intenta más tarde.");
    }
  }

  public void comprobante(String destinatario, String persona, String numero, byte[] pdf) {
    enviarMensaje(
        destinatario,
        "FlorArte · Tu comprobante " + numero,
        plantilla(
            "Tu comprobante de FlorArte",
            "<p style='line-height:1.6'>Hola, "
                + HtmlUtils.htmlEscape(persona)
                + ".</p><p style='line-height:1.6'>Adjuntamos el documento <strong>"
                + HtmlUtils.htmlEscape(numero)
                + "</strong> en PDF, con el detalle de tu operación.</p><p>Gracias por confiar en"
                + " FlorArte.</p><p style='font-size:12px;color:#687650'>Este documento registra la"
                + " operación y no confirma por sí solo el pago.</p>",
            false),
        pdf,
        numero + ".pdf");
  }

  public void codigo(String correo, String codigo, boolean configuracion) {
    enviar(
        correo,
        "FlorArte · Código de verificación",
        plantilla(
            "Verifica tu identidad",
            "<p style='line-height:1.6'>"
                + (configuracion
                    ? "Confirma el cambio de autenticación de dos factores."
                    : "Completa tu inicio de sesión en FlorArte.")
                + "</p><div style='padding:22px;background:#f2f5e7;border:1px solid"
                + " #d7dfc2;border-radius:12px;text-align:center;font-size:32px;letter-spacing:8px;color:#2f6f5e;font-weight:bold'>"
                + codigo
                + "</div><p>Este código vence en <strong>5 minutos</strong> y solo puede usarse una"
                + " vez.</p>"));
  }

  @Async("correoExecutor")
  public void recuperacion(String correo, String enlace) {
    try {
      enviar(
          correo,
          "FlorArte · Restablece tu contraseña",
          plantilla(
              "Recupera el acceso a tu cuenta",
              "<p style='line-height:1.6'>Solicitaste restablecer tu contraseña. El enlace vence en"
                  + " <strong>15 minutos</strong> y solo puede usarse una vez.</p><p"
                  + " style='margin:26px 0'><a href='"
                  + HtmlUtils.htmlEscape(enlace)
                  + "' style='display:inline-block;background:#797d11;color:white;padding:14px"
                  + " 20px;border-radius:9px;text-decoration:none;font-weight:bold'>Restablecer"
                  + " contraseña</a></p><p style='font-size:12px;word-break:break-all'>También"
                  + " puedes copiar este enlace:<br>"
                  + HtmlUtils.htmlEscape(enlace)
                  + "</p>"));
    } catch (FlujoAuthException e) {
      log.warn("Recuperación: correo no entregado [{}]", e.codigo);
    }
  }
}
