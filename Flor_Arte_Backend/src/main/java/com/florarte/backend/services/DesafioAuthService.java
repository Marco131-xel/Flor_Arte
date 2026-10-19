package com.florarte.backend.services;

import com.florarte.backend.exceptions.FlujoAuthException;
import com.florarte.backend.jwt.JwtUtil;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DesafioAuthService {
  private final JdbcTemplate jdbc;
  private final Clock clock;
  private final SecretosAuth secretos;
  private final CorreoService correo;
  private final JwtUtil jwt;
  private final SecureRandom random = new SecureRandom();

  public DesafioAuthService(
      JdbcTemplate jdbc, Clock clock, SecretosAuth secretos, CorreoService correo, JwtUtil jwt) {
    this.jdbc = jdbc;
    this.clock = clock;
    this.secretos = secretos;
    this.correo = correo;
    this.jwt = jwt;
  }

  private FlujoAuthException invalido() {
    return new FlujoAuthException(
        401,
        "DESAFIO_INVALIDO",
        "La verificación venció o ya no es válida. Inicia sesión nuevamente.");
  }

  private Map<String, Object> usuario(long id) {
    var filas =
        jdbc.queryForList(
            "SELECT u.id_usuario,u.email,u.estado,u.auth_version,u.twofa_habilitado,p.nombre,r.tipo"
                + " FROM usuario u JOIN persona p ON p.id_persona=u.id_persona JOIN rol r ON"
                + " r.id_rol=p.id_rol WHERE u.id_usuario=? FOR UPDATE OF u",
            id);
    if (filas.isEmpty() || !Boolean.TRUE.equals(filas.getFirst().get("estado"))) throw invalido();
    return filas.getFirst();
  }

  private long version(Map<String, Object> row) {
    return ((Number) row.get("auth_version")).longValue();
  }

  private Map<String, Object> sesion(Map<String, Object> u) {
    return Map.of(
        "requires2fa",
        false,
        "message",
        "Inicio de sesión exitoso",
        "token",
        jwt.generateTokenClaims((String) u.get("email"), (String) u.get("tipo"), version(u)),
        "nombre",
        u.get("nombre"),
        "tipoUsuario",
        u.get("tipo"),
        "id_usuario",
        u.get("id_usuario"),
        "estado",
        u.get("estado"));
  }

  @Transactional(noRollbackFor = FlujoAuthException.class)
  public Map<String, Object> iniciar(long id, long version, String proposito, Boolean habilitar) {
    var u = usuario(id);
    if (version(u) != version) throw invalido();
    if (proposito.equals("LOGIN") && !Boolean.TRUE.equals(u.get("twofa_habilitado")))
      return sesion(u);
    jdbc.update("UPDATE desafio_2fa SET utilizado=TRUE WHERE id_usuario=? AND NOT utilizado", id);
    UUID desafio = UUID.randomUUID();
    var ahora = clock.instant();
    String codigo = String.format(Locale.ROOT, "%06d", random.nextInt(1000000));
    jdbc.update(
        "INSERT INTO"
            + " desafio_2fa(id_desafio,id_usuario,proposito,habilitar,codigo_hash,auth_version,expira_en,limite_en,reenviado_en)"
            + " VALUES (?,?,?,?,?,?,?,?,?)",
        desafio,
        id,
        proposito,
        habilitar,
        secretos.hmac(desafio + ":" + codigo),
        version,
        Timestamp.from(ahora.plusSeconds(300)),
        Timestamp.from(ahora.plusSeconds(900)),
        Timestamp.from(ahora));
    try {
      correo.codigo((String) u.get("email"), codigo, proposito.equals("CONFIGURAR"));
    } catch (FlujoAuthException e) {
      jdbc.update("UPDATE desafio_2fa SET utilizado=TRUE WHERE id_desafio=?", desafio);
      throw e;
    }
    return pendiente(desafio, 300, 60);
  }

  private Map<String, Object> pendiente(UUID id, long segundos, long espera) {
    return Map.of(
        "requires2fa",
        true,
        "challengeId",
        id.toString(),
        "expiresInSeconds",
        segundos,
        "resendAfterSeconds",
        espera,
        "message",
        "Enviamos un código al correo registrado.");
  }

  private Map<String, Object> desafio(UUID id, String proposito, String email) {
    var inicial = jdbc.queryForList("SELECT id_usuario FROM desafio_2fa WHERE id_desafio=?", id);
    if (inicial.isEmpty()) throw invalido();
    var u = usuario(((Number) inicial.getFirst().get("id_usuario")).longValue());
    var filas = jdbc.queryForList("SELECT * FROM desafio_2fa WHERE id_desafio=? FOR UPDATE", id);
    if (filas.isEmpty()) throw invalido();
    var d = filas.getFirst();
    if (Boolean.TRUE.equals(d.get("utilizado"))
        || !proposito.equals(d.get("proposito"))
        || version(u) != version(d)
        || !((Timestamp) d.get("limite_en")).toInstant().isAfter(clock.instant())
        || email != null && !email.equals(u.get("email"))) throw invalido();
    if (((Number) d.get("intentos")).intValue() >= 5)
      throw new FlujoAuthException(
          401, "INTENTOS_AGOTADOS", "Alcanzaste el límite de intentos. Inicia sesión nuevamente.");
    d.put("usuario", u);
    return d;
  }

  private UUID uuid(String id) {
    try {
      return UUID.fromString(id);
    } catch (IllegalArgumentException e) {
      throw invalido();
    }
  }

  @Transactional(noRollbackFor = FlujoAuthException.class)
  public Map<String, Object> verificar(String id, String codigo, String proposito, String email) {
    var identificador = uuid(id);
    var d = desafio(identificador, proposito, email);
    var ahora = clock.instant();
    if (!((Timestamp) d.get("expira_en")).toInstant().isAfter(ahora))
      throw new FlujoAuthException(401, "CODIGO_EXPIRADO", "El código expiró. Solicita uno nuevo.");
    if (!secretos.coincide(
        (String) d.get("codigo_hash"), secretos.hmac(identificador + ":" + codigo))) {
      int intentos = ((Number) d.get("intentos")).intValue() + 1;
      jdbc.update(
          "UPDATE desafio_2fa SET intentos=?,utilizado=? WHERE id_desafio=?",
          intentos,
          intentos >= 5,
          identificador);
      throw new FlujoAuthException(
          401,
          intentos >= 5 ? "INTENTOS_AGOTADOS" : "CODIGO_INCORRECTO",
          intentos >= 5
              ? "Alcanzaste el límite de intentos. Inicia sesión nuevamente."
              : "El código es incorrecto. Te quedan " + (5 - intentos) + " intentos.");
    }
    jdbc.update("UPDATE desafio_2fa SET utilizado=TRUE WHERE id_desafio=?", identificador);
    @SuppressWarnings("unchecked")
    var u = (Map<String, Object>) d.get("usuario");
    if (proposito.equals("CONFIGURAR")) {
      jdbc.update(
          "UPDATE usuario SET twofa_habilitado=? WHERE id_usuario=?",
          d.get("habilitar"),
          u.get("id_usuario"));
      u = usuario(((Number) u.get("id_usuario")).longValue());
    }
    return sesion(u);
  }

  @Transactional(noRollbackFor = FlujoAuthException.class)
  public Map<String, Object> reenviar(String id, String proposito, String email) {
    var identificador = uuid(id);
    var d = desafio(identificador, proposito, email);
    var ahora = clock.instant();
    if (((Number) d.get("reenvios")).intValue() >= 3)
      throw new FlujoAuthException(
          429, "REENVIOS_AGOTADOS", "Alcanzaste el límite de reenvíos. Inicia sesión nuevamente.");
    var hasta = ((Timestamp) d.get("reenviado_en")).toInstant().plusSeconds(60);
    long espera = Math.max(1, (Duration.between(ahora, hasta).toMillis() + 999) / 1000);
    if (ahora.isBefore(hasta))
      throw new FlujoAuthException(
          429, "ESPERA_REENVIO", "Espera " + espera + " segundos para reenviar.");
    String codigo;
    do {
      codigo = String.format(Locale.ROOT, "%06d", random.nextInt(1000000));
    } while (secretos.coincide(
        (String) d.get("codigo_hash"), secretos.hmac(identificador + ":" + codigo)));
    var expira = ahora.plusSeconds(300);
    var limite = ((Timestamp) d.get("limite_en")).toInstant();
    if (expira.isAfter(limite)) expira = limite;
    jdbc.update(
        "UPDATE desafio_2fa SET codigo_hash=?,expira_en=?,reenviado_en=?,reenvios=reenvios+1 WHERE"
            + " id_desafio=?",
        secretos.hmac(identificador + ":" + codigo),
        Timestamp.from(expira),
        Timestamp.from(ahora),
        identificador);
    @SuppressWarnings("unchecked")
    var u = (Map<String, Object>) d.get("usuario");
    try {
      correo.codigo((String) u.get("email"), codigo, proposito.equals("CONFIGURAR"));
    } catch (FlujoAuthException e) {
      jdbc.update("UPDATE desafio_2fa SET utilizado=TRUE WHERE id_desafio=?", identificador);
      throw e;
    }
    return pendiente(identificador, Duration.between(ahora, expira).getSeconds(), 60);
  }

  public Map<String, Object> configuracion(String email) {
    var filas =
        jdbc.queryForList(
            "SELECT twofa_habilitado AS habilitado FROM usuario WHERE email=? AND estado", email);
    if (filas.isEmpty()) throw invalido();
    return filas.getFirst();
  }
}
