package com.florarte.backend.services;

import com.florarte.backend.exceptions.FlujoAuthException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecuperacionService {
  private final JdbcTemplate jdbc;
  private final Clock clock;
  private final CorreoService correo;
  private final PasswordEncoder encoder;
  private final String url;
  private final SecureRandom random = new SecureRandom();

  public RecuperacionService(
      JdbcTemplate jdbc,
      Clock clock,
      CorreoService correo,
      PasswordEncoder encoder,
      @Value("${florarte.auth.recovery-url}") String url) {
    var uri = URI.create(url);
    if (uri.getHost() == null
        || uri.getUserInfo() != null
        || uri.getFragment() != null
        || uri.getQuery() != null
        || !(uri.getScheme().equals("https")
            || uri.getScheme().equals("http")
                && Set.of("localhost", "127.0.0.1").contains(uri.getHost())))
      throw new IllegalStateException(
          "AUTH_RECOVERY_URL debe ser HTTPS o localhost HTTP, sin parámetros ni fragmentos");
    this.jdbc = jdbc;
    this.clock = clock;
    this.correo = correo;
    this.encoder = encoder;
    this.url = url;
  }

  @Transactional
  public void solicitar(String email) {
    var filas =
        jdbc.queryForList(
            "SELECT id_usuario,email,auth_version FROM usuario WHERE email=? AND estado FOR UPDATE",
            email.strip());
    if (filas.isEmpty()) return;
    var u = filas.getFirst();
    generar(u);
  }

  @Transactional
  public String solicitarEmpleado(long id) {
    var filas =
        jdbc.queryForList(
            "SELECT u.id_usuario,u.email,u.auth_version FROM usuario u JOIN persona p ON"
                + " p.id_persona=u.id_persona JOIN rol r ON r.id_rol=p.id_rol WHERE u.id_usuario=?"
                + " AND u.estado AND r.tipo='EMPLEADO' FOR UPDATE OF u",
            id);
    if (filas.isEmpty())
      throw new FlujoAuthException(
          400,
          "EMPLEADO_NO_DISPONIBLE",
          "Selecciona una cuenta activa de empleado para solicitar el cambio de contraseña.");
    var usuario = filas.getFirst();
    generar(usuario);
    return (String) usuario.get("email");
  }

  private void generar(Map<String, Object> u) {
    jdbc.update(
        "UPDATE recuperacion_password SET utilizado=TRUE WHERE id_usuario=? AND NOT utilizado",
        u.get("id_usuario"));
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes),
        hash = SecretosAuth.hash(token);
    jdbc.update(
        "INSERT INTO recuperacion_password(token_hash,id_usuario,auth_version,expira_en) VALUES"
            + " (?,?,?,?)",
        hash,
        u.get("id_usuario"),
        u.get("auth_version"),
        Timestamp.from(clock.instant().plusSeconds(900)));
    try {
      correo.recuperacion((String) u.get("email"), url + "#token=" + token);
    } catch (RuntimeException e) {
      jdbc.update("UPDATE recuperacion_password SET utilizado=TRUE WHERE token_hash=?", hash);
    }
  }

  private FlujoAuthException invalido() {
    return new FlujoAuthException(
        400,
        "ENLACE_INVALIDO",
        "El enlace es inválido, expiró o ya fue utilizado. Solicita uno nuevo.");
  }

  @Transactional
  public void restablecer(String token, String password, String confirmacion) {
    if (!password.equals(confirmacion))
      throw new FlujoAuthException(400, "PASSWORD_CONFIRMACION", "Las contraseñas no coinciden.");
    if (password.length() < 8 || password.getBytes(StandardCharsets.UTF_8).length > 72)
      throw new FlujoAuthException(
          400,
          "PASSWORD_INVALIDA",
          "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.");
    if (!token.matches("[A-Za-z0-9_-]{43}")) throw invalido();
    String hash = SecretosAuth.hash(token);
    var inicial =
        jdbc.queryForList("SELECT id_usuario FROM recuperacion_password WHERE token_hash=?", hash);
    if (inicial.isEmpty()) throw invalido();
    long id = ((Number) inicial.getFirst().get("id_usuario")).longValue();
    var usuarios =
        jdbc.queryForList(
            "SELECT auth_version,estado FROM usuario WHERE id_usuario=? FOR UPDATE", id);
    if (usuarios.isEmpty() || !Boolean.TRUE.equals(usuarios.getFirst().get("estado")))
      throw invalido();
    var filas =
        jdbc.queryForList(
            "SELECT * FROM recuperacion_password WHERE token_hash=? FOR UPDATE", hash);
    if (filas.isEmpty()) throw invalido();
    var r = filas.getFirst();
    if (Boolean.TRUE.equals(r.get("utilizado"))
        || !r.get("auth_version").equals(usuarios.getFirst().get("auth_version"))
        || !((Timestamp) r.get("expira_en")).toInstant().isAfter(clock.instant())) throw invalido();
    jdbc.update("UPDATE recuperacion_password SET utilizado=TRUE WHERE id_usuario=?", id);
    jdbc.update(
        "UPDATE usuario SET password=?, token=NULL, auth_version=auth_version+1 WHERE id_usuario=?",
        encoder.encode(password),
        id);
  }
}
