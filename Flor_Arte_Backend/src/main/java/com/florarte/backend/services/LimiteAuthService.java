package com.florarte.backend.services;

import com.florarte.backend.exceptions.FlujoAuthException;
import java.sql.Timestamp;
import java.time.Clock;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class LimiteAuthService {
  private final JdbcTemplate jdbc;
  private final Clock clock;
  private final SecretosAuth secretos;

  public LimiteAuthService(JdbcTemplate jdbc, Clock clock, SecretosAuth secretos) {
    this.jdbc = jdbc;
    this.clock = clock;
    this.secretos = secretos;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = FlujoAuthException.class)
  public void consumir(String clave, int maximo, int segundos) {
    var ahora = clock.instant();
    int cantidad =
        jdbc.queryForObject(
            "INSERT INTO limite_autenticacion(clave,inicio_en,cantidad) VALUES (?,?,1) ON"
                + " CONFLICT(clave) DO UPDATE SET cantidad=CASE WHEN"
                + " limite_autenticacion.inicio_en<=? THEN 1 ELSE limite_autenticacion.cantidad+1"
                + " END,inicio_en=CASE WHEN limite_autenticacion.inicio_en<=? THEN"
                + " EXCLUDED.inicio_en ELSE limite_autenticacion.inicio_en END RETURNING cantidad",
            Integer.class,
            secretos.hmac("limite:" + clave),
            Timestamp.from(ahora),
            Timestamp.from(ahora.minusSeconds(segundos)),
            Timestamp.from(ahora.minusSeconds(segundos)));
    if (cantidad > maximo)
      throw new FlujoAuthException(
          429,
          "LIMITE_FRECUENCIA",
          "Demasiadas solicitudes. Espera unos minutos antes de intentar nuevamente.");
  }

  @Scheduled(fixedDelay = 3600000, initialDelay = 3600000)
  public void limpiar() {
    jdbc.update(
        "DELETE FROM limite_autenticacion WHERE inicio_en<?",
        Timestamp.from(clock.instant().minusSeconds(86400)));
    jdbc.update(
        "DELETE FROM desafio_2fa WHERE limite_en<?",
        Timestamp.from(clock.instant().minusSeconds(86400)));
    jdbc.update(
        "DELETE FROM recuperacion_password WHERE expira_en<?",
        Timestamp.from(clock.instant().minusSeconds(86400)));
  }
}
