package com.florarte.backend.config;

import com.florarte.backend.support.PostgresTemporal;
import com.florarte.backend.services.CorreoService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
  "jwt.secret=jwt-de-prueba-prod-012345678901234567890123456789",
  "florarte.auth.code-secret=otp-de-prueba-prod-012345678901234567890123456789",
  "CORS_ALLOWED_ORIGINS=https://app.example",
  "florarte.auth.recovery-url=https://app.example/restablecer-contrasena",
  "spring.mail.username=smtp@example.invalid", "spring.mail.password=solo-prueba",
  "florarte.mail.from=smtp@example.invalid"})
@ActiveProfiles("prod")
@EnabledIfSystemProperty(named="florarte.test.db",matches="jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/florarte_test")
@ResourceLock(PostgresTemporal.RECURSO)
class ProduccionArranqueIntegrationTest {
  @Autowired JdbcTemplate jdbc;
  @MockitoBean CorreoService correo;
  @DynamicPropertySource static void db(DynamicPropertyRegistry p){
    PostgresTemporal.esquemaVacio(PostgresTemporal.datasource());PostgresTemporal.registrar(p);
  }
  @Test void perfilProdRegistraCallbackYArrancaSinUsuariosDemo(){
    assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM usuario",Integer.class));
    assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM persona",Integer.class));
    assertEquals(19,jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE success",Integer.class));
  }
}
