package com.florarte.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.florarte.backend.exceptions.FlujoAuthException;
import com.florarte.backend.services.CorreoService;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** Solo se ejecuta sobre la base temporal explícita; nunca envía correos. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "spring.jpa.show-sql=false", "jwt.secret=clave-exclusiva-de-pruebas-florarte-0123456789",
      "jwt.expiration=3600",
          "florarte.auth.code-secret=secreto-hmac-exclusivo-de-pruebas-0123456789",
      "florarte.auth.recovery-url=http://localhost:5173/restablecer-contrasena"
    })
@EnabledIfSystemProperty(
    named = "florarte.test.db",
    matches = "jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/florarte_test")
class SeguridadCorreoIntegrationTest {
  @LocalServerPort int port;
  @Autowired JdbcTemplate jdbc;
  @Autowired PasswordEncoder encoder;
  @Autowired com.florarte.backend.services.DesafioAuthService desafios;
  @MockitoBean CorreoService correo;
  @MockitoBean Clock clock;
  final ObjectMapper json = new ObjectMapper();
  final HttpClient http = HttpClient.newHttpClient();
  final AtomicReference<Instant> ahora = new AtomicReference<>();
  String codigo, enlace;
  long usuario;
  static final String EMAIL = "seguridad@florarte.test", PASSWORD = "Password-original-1";

  @DynamicPropertySource
  static void db(DynamicPropertyRegistry props) {
    String password = System.getenv("FLORARTE_TEST_DB_PASSWORD");
    if (password == null || password.isBlank()) {
        throw new IllegalStateException(
            "Define FLORARTE_TEST_DB_PASSWORD para la base temporal florarte_test");
    }

    props.add("spring.datasource.url", () -> System.getProperty("florarte.test.db"));
    props.add("spring.datasource.username", () -> "florarte_test");
    props.add("spring.datasource.password", () -> password);
  }

  @BeforeEach
  void preparar() {
    ahora.set(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
    when(clock.instant()).thenAnswer(inv -> ahora.get());
    when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    jdbc.update("DELETE FROM limite_autenticacion");
    jdbc.update("DELETE FROM usuario WHERE email=?", EMAIL);
    jdbc.update("DELETE FROM persona WHERE nombre='Prueba seguridad correo'");
    long rol = jdbc.queryForObject("SELECT id_rol FROM rol WHERE tipo='EMPLEADO'", Long.class);
    long persona =
        jdbc.queryForObject(
            "INSERT INTO persona(nombre,id_rol) VALUES ('Prueba seguridad correo',?) RETURNING"
                + " id_persona",
            Long.class,
            rol);
    usuario =
        jdbc.queryForObject(
            "INSERT INTO usuario(name,email,password,id_persona) VALUES ('seguridad_test',?,?,?)"
                + " RETURNING id_usuario",
            Long.class,
            EMAIL,
            encoder.encode(PASSWORD),
            persona);
    codigo = null;
    enlace = null;
    doAnswer(
            inv -> {
              codigo = inv.getArgument(1);
              return null;
            })
        .when(correo)
        .codigo(anyString(), anyString(), anyBoolean());
    doAnswer(
            inv -> {
              enlace = inv.getArgument(1);
              return null;
            })
        .when(correo)
        .recuperacion(anyString(), anyString());
  }

  record Respuesta(int status, com.fasterxml.jackson.databind.JsonNode body) {}

  Respuesta pedir(String method, String path, Object body, String token) throws Exception {
    var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path));
    if (token != null) builder.header("Authorization", "Bearer " + token);
    if (body != null) builder.header("Content-Type", "application/json");
    builder.method(
        method,
        body == null
            ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
    var response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    // Nunca incluir el cuerpo con credenciales/códigos en mensajes de aserción.
    var result =
        response.body().startsWith("{") ? json.readTree(response.body()) : json.createObjectNode();
    return new Respuesta(response.statusCode(), result);
  }

  Respuesta post(String path, Object body) throws Exception {
    return pedir("POST", path, body, null);
  }

  Respuesta login() throws Exception {
    return post("/auth/login", Map.of("correo", EMAIL, "contrasena", PASSWORD));
  }

  String desafio() throws Exception {
    jdbc.update("UPDATE usuario SET twofa_habilitado=TRUE WHERE id_usuario=?", usuario);
    var r = login();
    assertEquals(200, r.status);
    assertTrue(r.body.path("requires2fa").asBoolean());
    assertFalse(r.body.has("token"));
    return r.body.path("challengeId").asText();
  }

  Respuesta verificar(String id, String code) throws Exception {
    return post("/auth/2fa/verificar", Map.of("challengeId", id, "codigo", code));
  }

  Respuesta reenviar(String id) throws Exception {
    return post("/auth/2fa/reenviar", Map.of("challengeId", id));
  }

  void avanzar(long seconds) {
    ahora.updateAndGet(t -> t.plusSeconds(seconds));
  }

  String recuperar() throws Exception {
    assertEquals(200, post("/auth/recuperacion/solicitar", Map.of("correo", EMAIL)).status);
    assertNotNull(enlace);
    assertTrue(enlace.startsWith("http://localhost:5173/restablecer-contrasena#token="));
    return enlace.substring(enlace.indexOf("#token=") + 7);
  }

  Respuesta reset(String token, String password) throws Exception {
    return post(
        "/auth/recuperacion/restablecer",
        Map.of("token", token, "contrasena", password, "confirmacion", password));
  }

  @Test
  void loginCompatibleSin2fa() throws Exception {
    var r = login();
    assertEquals(200, r.status);
    assertFalse(r.body.path("requires2fa").asBoolean());
    assertEquals("EMPLEADO", r.body.path("tipoUsuario").asText());
    assertEquals(200, pedir("GET", "/auth/check-auth", null, r.body.path("token").asText()).status);
    verify(correo, never()).codigo(anyString(), anyString(), anyBoolean());
  }

  @Test
  void segundoFactorCompletaSesionYEsDeUnSoloUso() throws Exception {
    String id = desafio(), code = codigo;
    assertTrue(code.matches("[0-9]{6}"));
    String hash =
        jdbc.queryForObject(
            "SELECT codigo_hash FROM desafio_2fa WHERE id_desafio=?::uuid", String.class, id);
    assertEquals(64, hash.length());
    assertNotEquals(code, hash);
    assertEquals(401, pedir("GET", "/auth/check-auth", null, null).status);
    assertEquals(401, pedir("GET", "/auth/check-auth", null, id).status);
    var r = verificar(id, code);
    assertEquals(200, r.status);
    assertEquals("EMPLEADO", r.body.path("tipoUsuario").asText());
    assertEquals(200, pedir("GET", "/auth/check-auth", null, r.body.path("token").asText()).status);
    assertEquals(401, verificar(id, code).status);
  }

  @Test
  void cincoErroresAgotanIntentosInclusoTrasReenvio() throws Exception {
    String id = desafio();
    String wrong = codigo.equals("000000") ? "000001" : "000000";
    assertEquals(401, verificar(id, wrong).status);
    avanzar(61);
    assertEquals(200, reenviar(id).status);
    wrong = codigo.equals("000000") ? "000001" : "000000";
    for (int i = 0; i < 4; i++) assertEquals(401, verificar(id, wrong).status);
    assertEquals(
        5,
        jdbc.queryForObject(
            "SELECT intentos FROM desafio_2fa WHERE id_desafio=?::uuid", Integer.class, id));
    assertEquals(401, verificar(id, codigo).status);
    assertEquals(401, reenviar(id).status);
  }

  @Test
  void codigoVenceEnCincoMinutosPeroSePuedeReenviar() throws Exception {
    String id = desafio(), anterior = codigo;
    avanzar(300);
    var r = verificar(id, anterior);
    assertEquals(401, r.status);
    assertEquals("CODIGO_EXPIRADO", r.body.path("error").asText());
    assertEquals(200, reenviar(id).status);
    assertNotEquals(anterior, codigo);
    assertEquals(401, verificar(id, anterior).status);
    assertEquals(200, verificar(id, codigo).status);
  }

  @Test
  void reenvioEspera60SegundosMaximoTresYDesafioVence() throws Exception {
    String id = desafio();
    assertEquals(429, reenviar(id).status);
    avanzar(59);
    assertEquals(429, reenviar(id).status);
    avanzar(-59);
    for (int i = 0; i < 3; i++) {
      avanzar(60);
      assertEquals(200, reenviar(id).status);
    }
    avanzar(60);
    assertEquals(429, reenviar(id).status);
    avanzar(660);
    assertEquals(401, verificar(id, codigo).status);
  }

  @Test
  void nuevoLoginInvalidaElCodigoAnterior() throws Exception {
    String antiguo = desafio(), code = codigo;
    String nuevo = login().body.path("challengeId").asText();
    assertNotEquals(antiguo, nuevo);
    assertEquals(401, verificar(antiguo, code).status);
    assertEquals(200, verificar(nuevo, codigo).status);
  }

  @Test
  void credencialesIncorrectasNoGeneranNiEnvianCodigos() throws Exception {
    jdbc.update("UPDATE usuario SET twofa_habilitado=TRUE WHERE id_usuario=?", usuario);
    assertEquals(
        401, post("/auth/login", Map.of("correo", EMAIL, "contrasena", "incorrecta")).status);
    verify(correo, never()).codigo(anyString(), anyString(), anyBoolean());
    assertEquals(
        0,
        jdbc.queryForObject(
            "SELECT count(*) FROM desafio_2fa WHERE id_usuario=?", Integer.class, usuario));
  }

  @Test
  void falloSmtpNoEntregaSesionNiDesafioUtilizable() throws Exception {
    jdbc.update("UPDATE usuario SET twofa_habilitado=TRUE WHERE id_usuario=?", usuario);
    doThrow(new FlujoAuthException(503, "CORREO_NO_DISPONIBLE", "No se pudo enviar el correo."))
        .when(correo)
        .codigo(anyString(), anyString(), anyBoolean());
    var r = login();
    assertEquals(503, r.status);
    assertFalse(r.body.has("token"));
    assertEquals(
        0,
        jdbc.queryForObject(
            "SELECT count(*) FROM desafio_2fa WHERE id_usuario=? AND NOT utilizado",
            Integer.class,
            usuario));
  }

  @Test
  void solicitarRecuperacionNoRevelaExistenciaYLimitaAmbosCasos() throws Exception {
    var existente = post("/auth/recuperacion/solicitar", Map.of("correo", EMAIL));
    var desconocido = post("/auth/recuperacion/solicitar", Map.of("correo", "nadie@florarte.test"));
    assertEquals(existente.status, desconocido.status);
    assertEquals(existente.body, desconocido.body);
    for (int i = 0; i < 2; i++) {
      assertEquals(200, post("/auth/recuperacion/solicitar", Map.of("correo", EMAIL)).status);
      assertEquals(
          200,
          post("/auth/recuperacion/solicitar", Map.of("correo", "nadie@florarte.test")).status);
    }
    assertEquals(429, post("/auth/recuperacion/solicitar", Map.of("correo", EMAIL)).status);
    assertEquals(
        429, post("/auth/recuperacion/solicitar", Map.of("correo", "nadie@florarte.test")).status);
    assertTrue(
        jdbc.queryForList("SELECT clave FROM limite_autenticacion").stream()
            .noneMatch(r -> r.get("clave").toString().contains(EMAIL)));
  }

  @Test
  void cambiarContrasenaInvalidaEnlaceYJwtYPermiteLoginNuevo() throws Exception {
    String antiguo = login().body.path("token").asText();
    String token = recuperar();
    assertEquals(43, token.length());
    String hash =
        jdbc.queryForObject(
            "SELECT token_hash FROM recuperacion_password WHERE id_usuario=? AND NOT utilizado",
            String.class,
            usuario);
    assertEquals(64, hash.length());
    assertNotEquals(token, hash);
    assertEquals(200, reset(token, "Nueva-contrasena-2").status);
    assertEquals(400, reset(token, "Nueva-contrasena-3").status);
    assertEquals(401, pedir("GET", "/auth/check-auth", null, antiguo).status);
    assertEquals(401, login().status);
    assertEquals(
        200,
        post("/auth/login", Map.of("correo", EMAIL, "contrasena", "Nueva-contrasena-2")).status);
    assertTrue(
        encoder.matches(
            "Nueva-contrasena-2",
            jdbc.queryForObject(
                "SELECT password FROM usuario WHERE id_usuario=?", String.class, usuario)));
  }

  @Test
  void recuperacionVencidaInvalidaYReemplazada() throws Exception {
    String primero = recuperar();
    String segundo = recuperar();
    assertEquals(400, reset(primero, "Nueva-clave-2").status);
    assertEquals(400, reset("X".repeat(43), "Nueva-clave-2").status);
    avanzar(900);
    assertEquals(400, reset(segundo, "Nueva-clave-2").status);
    assertTrue(
        encoder.matches(
            PASSWORD,
            jdbc.queryForObject(
                "SELECT password FROM usuario WHERE id_usuario=?", String.class, usuario)));
  }

  @Test
  void cambioDePasswordConserva2faPeroInvalidaDesafiosPendientes() throws Exception {
    String id = desafio(), code = codigo;
    String token = recuperar();
    assertEquals(200, reset(token, "Nueva-clave-2").status);
    assertEquals(401, verificar(id, code).status);
    var r = post("/auth/login", Map.of("correo", EMAIL, "contrasena", "Nueva-clave-2"));
    assertTrue(r.body.path("requires2fa").asBoolean());
    assertFalse(r.body.has("token"));
  }

  @Test
  void configuracionExigeSesionContrasenaYCorreoYRenuevaJwt() throws Exception {
    String jwt = login().body.path("token").asText();
    assertEquals(
        401,
        post("/auth/2fa/configuracion/iniciar", Map.of("habilitado", true, "contrasena", PASSWORD))
            .status);
    assertEquals(
        401,
        pedir(
                "POST",
                "/auth/2fa/configuracion/iniciar",
                Map.of("habilitado", true, "contrasena", "incorrecta"),
                jwt)
            .status);
    var pendiente =
        pedir(
            "POST",
            "/auth/2fa/configuracion/iniciar",
            Map.of("habilitado", true, "contrasena", PASSWORD),
            jwt);
    assertEquals(200, pendiente.status);
    String id = pendiente.body.path("challengeId").asText();
    assertEquals(
        401,
        verificar(id, codigo)
            .status); // Propósito de configuración nunca funciona en el login público.
    var confirmada =
        pedir(
            "POST",
            "/auth/2fa/configuracion/verificar",
            Map.of("challengeId", id, "codigo", codigo),
            jwt);
    assertEquals(200, confirmada.status);
    assertEquals(401, pedir("GET", "/auth/check-auth", null, jwt).status);
    String nuevo = confirmada.body.path("token").asText();
    assertEquals(200, pedir("GET", "/auth/check-auth", null, nuevo).status);
    assertTrue(
        pedir("GET", "/auth/2fa/configuracion", null, nuevo).body.path("habilitado").asBoolean());
    assertTrue(login().body.path("requires2fa").asBoolean());
  }

  @Test
  void frecuenciaLoginYRecuperacionSeRecuperaTrasLaVentana() throws Exception {
    for (int i = 0; i < 10; i++) assertEquals(200, login().status);
    assertEquals(429, login().status);
    avanzar(900);
    assertEquals(200, login().status);
  }

  @Test
  void confirmacionYLimiteBytesSeValidanSinCambiarPassword() throws Exception {
    String token = recuperar();
    assertEquals(
        400,
        post(
                "/auth/recuperacion/restablecer",
                Map.of(
                    "token", token, "contrasena", "Nueva-clave-2", "confirmacion", "otra-clave-2"))
            .status);
    assertEquals(400, reset(token, "é".repeat(40)).status);
    assertEquals(200, reset(token, "Nueva-clave-2").status);
  }

  @Test
  void permisosEmpleadoYAdministradorSeMantienenDespuesDel2fa() throws Exception {
    String id = desafio();
    String empleado = verificar(id, codigo).body.path("token").asText();
    assertEquals(
        403,
        pedir("GET", "/reporte/financieros?periodo=MES&fecha=2026-10-07", null, empleado).status);
    jdbc.update(
        "UPDATE persona SET id_rol=(SELECT id_rol FROM rol WHERE tipo='ADMINISTRADOR') WHERE"
            + " id_persona=(SELECT id_persona FROM usuario WHERE id_usuario=?)",
        usuario);
    String adminId = login().body.path("challengeId").asText();
    var r = verificar(adminId, codigo);
    assertEquals("ADMINISTRADOR", r.body.path("tipoUsuario").asText());
    assertEquals(
        200,
        pedir(
                "GET",
                "/reporte/financieros?periodo=MES&fecha=2026-10-07",
                null,
                r.body.path("token").asText())
            .status);
  }

  @Test
  void desactivar2faTambienExigeCodigoYNoAceptaOtraIdentidad() throws Exception {
    String id = desafio();
    String jwt = verificar(id, codigo).body.path("token").asText();
    var pendiente =
        pedir(
            "POST",
            "/auth/2fa/configuracion/iniciar",
            Map.of("habilitado", false, "contrasena", PASSWORD),
            jwt);
    String config = pendiente.body.path("challengeId").asText();
    assertThrows(
        FlujoAuthException.class,
        () -> desafios.verificar(config, codigo, "CONFIGURAR", "otro@florarte.test"));
    assertTrue(
        jdbc.queryForObject(
            "SELECT twofa_habilitado FROM usuario WHERE id_usuario=?", Boolean.class, usuario));
    var result =
        pedir(
            "POST",
            "/auth/2fa/configuracion/verificar",
            Map.of("challengeId", config, "codigo", codigo),
            jwt);
    assertEquals(200, result.status);
    assertEquals(401, pedir("GET", "/auth/check-auth", null, jwt).status);
    assertFalse(login().body.path("requires2fa").asBoolean());
  }

  @Test
  void sesionHistoricaSinVersionSoloEsValidaHastaElPrimerCambioDeSeguridad() throws Exception {
    var util = new com.florarte.backend.jwt.JwtUtil();
    org.springframework.test.util.ReflectionTestUtils.setField(
        util, "secret", "clave-exclusiva-de-pruebas-florarte-0123456789");
    org.springframework.test.util.ReflectionTestUtils.setField(util, "expiration", 3600);
    var details =
        org.springframework.security.core.userdetails.User.withUsername(EMAIL)
            .password("irrelevante")
            .roles("EMPLEADO")
            .build();
    String antiguo =
        util.generateToken(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                details, null, details.getAuthorities()));
    assertEquals(200, pedir("GET", "/auth/check-auth", null, antiguo).status);
    jdbc.update(
        "UPDATE usuario SET password=? WHERE id_usuario=?",
        encoder.encode("Nueva-clave-2"),
        usuario);
    assertEquals(401, pedir("GET", "/auth/check-auth", null, antiguo).status);
  }

  @Test
  void cuentaInactivaNoRecuperaYTokenNoSeAceptaTrasDesactivacion() throws Exception {
    String token = recuperar();
    jdbc.update("UPDATE usuario SET estado=FALSE WHERE id_usuario=?", usuario);
    assertEquals(400, reset(token, "Nueva-clave-2").status);
    clearInvocations(correo);
    assertEquals(200, post("/auth/recuperacion/solicitar", Map.of("correo", EMAIL)).status);
    verify(correo, never()).recuperacion(anyString(), anyString());
  }

  @Test
  void codigoNoSePuedeConsumirDosVecesEnPeticionesConcurrentes() throws Exception {
    String id = desafio(), code = codigo;
    var a =
        java.util.concurrent.CompletableFuture.supplyAsync(
            () -> {
              try {
                return verificar(id, code).status;
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            });
    var b =
        java.util.concurrent.CompletableFuture.supplyAsync(
            () -> {
              try {
                return verificar(id, code).status;
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            });
    assertEquals(Set.of(200, 401), Set.of(a.get(), b.get()));
  }

  @Test
  void tokenNoSePuedeConsumirDosVecesEnPeticionesConcurrentes() throws Exception {
    String token = recuperar();
    var a =
        java.util.concurrent.CompletableFuture.supplyAsync(
            () -> {
              try {
                return reset(token, "Nueva-clave-2").status;
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            });
    var b =
        java.util.concurrent.CompletableFuture.supplyAsync(
            () -> {
              try {
                return reset(token, "Nueva-clave-2").status;
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            });
    assertEquals(Set.of(200, 400), Set.of(a.get(), b.get()));
  }

  @Test
  void fallosDeEnvioDeRecuperacionNoRevelanCuentas() throws Exception {
    doThrow(new FlujoAuthException(503, "CORREO_NO_DISPONIBLE", "No se pudo enviar el correo."))
        .when(correo)
        .recuperacion(anyString(), anyString());
    var existe = post("/auth/recuperacion/solicitar", Map.of("correo", EMAIL));
    var noExiste = post("/auth/recuperacion/solicitar", Map.of("correo", "nadie@florarte.test"));
    assertEquals(200, existe.status);
    assertEquals(existe.body, noExiste.body);
    assertEquals(
        0,
        jdbc.queryForObject(
            "SELECT count(*) FROM recuperacion_password WHERE id_usuario=? AND NOT utilizado",
            Integer.class,
            usuario));
  }

  long reciboPrueba() throws Exception {
    var lineas =
        List.of(
            Map.of("descripcion", "Rosas históricas", "cantidad", 2, "precio", 10, "subtotal", 20));
    var documento =
        Map.of(
            "empresa",
            Map.of(
                "nombre",
                "FlorArte",
                "direccion",
                "Quetzaltenango",
                "correo",
                "empresa@example.com",
                "telefono",
                "35847828"),
            "persona",
            "Cliente recibo",
            "fecha",
            "2026-10-12T10:00:00",
            "estado",
            "ENTREGADO",
            "total",
            20,
            "lineas",
            lineas);
    return jdbc.queryForObject(
        "INSERT INTO comprobante(tipo,id_origen,emitido_por,documento) VALUES"
            + " ('PEDIDO',99999,?,?::jsonb) ON CONFLICT(tipo,id_origen) DO UPDATE SET"
            + " documento=EXCLUDED.documento RETURNING id_comprobante",
        Long.class,
        EMAIL,
        json.writeValueAsString(documento));
  }

  @Test
  void envioReciboSoloAutenticadoValidaCorreoYAdjuntaDatosGuardados() throws Exception {
    long id = reciboPrueba();
    String path = "/comprobante/" + id + "/correo";
    assertEquals(401, post(path, Map.of("correo", "cliente@example.com")).status);
    String jwt = login().body.path("token").asText();
    assertEquals(400, pedir("POST", path, Map.of("correo", "no-es-correo"), jwt).status);
    assertEquals(400, pedir("POST", path, Map.of("correo", ""), jwt).status);
    String antes =
        jdbc.queryForObject(
            "SELECT documento::text FROM comprobante WHERE id_comprobante=?", String.class, id);
    var response = pedir("POST", path, Map.of("correo", "cliente@example.com"), jwt);
    assertEquals(200, response.status);
    var bytes = org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(correo)
        .comprobante(
            eq("cliente@example.com"),
            eq("Cliente recibo"),
            eq(String.format(java.util.Locale.ROOT, "REC-%06d", id)),
            bytes.capture());
    try (var pdf = org.apache.pdfbox.Loader.loadPDF(bytes.getValue())) {
      assertTrue(
          new org.apache.pdfbox.text.PDFTextStripper().getText(pdf).contains("Rosas históricas"));
    }
    assertEquals(
        antes,
        jdbc.queryForObject(
            "SELECT documento::text FROM comprobante WHERE id_comprobante=?", String.class, id));
  }

  @Test
  void envioReciboRespetaLimitesDeFrecuenciaYErroresSmtp() throws Exception {
    long id = reciboPrueba();
    String path = "/comprobante/" + id + "/correo", jwt = login().body.path("token").asText();
    doThrow(
            new FlujoAuthException(
                503, "CORREO_NO_DISPONIBLE", "No se pudo enviar el correo. Intenta más tarde."))
        .when(correo)
        .comprobante(anyString(), anyString(), anyString(), any(byte[].class));
    assertEquals(503, pedir("POST", path, Map.of("correo", "cliente@example.com"), jwt).status);
    doNothing().when(correo).comprobante(anyString(), anyString(), anyString(), any(byte[].class));
    for (int i = 0; i < 2; i++)
      assertEquals(200, pedir("POST", path, Map.of("correo", "cliente@example.com"), jwt).status);
    assertEquals(429, pedir("POST", path, Map.of("correo", "otro@example.com"), jwt).status);
    avanzar(900);
    assertEquals(200, pedir("POST", path, Map.of("correo", "cliente@example.com"), jwt).status);
  }

  @Test
  void clienteNoPuedeEnviarRecibosYAdministradorSiPuede() throws Exception {
    long id = reciboPrueba();
    String path = "/comprobante/" + id + "/correo";
    jdbc.update(
        "UPDATE persona SET id_rol=(SELECT id_rol FROM rol WHERE tipo='CLIENTE') WHERE"
            + " id_persona=(SELECT id_persona FROM usuario WHERE id_usuario=?)",
        usuario);
    String jwt = login().body.path("token").asText();
    assertEquals(403, pedir("POST", path, Map.of("correo", "cliente@example.com"), jwt).status);
    jdbc.update(
        "UPDATE persona SET id_rol=(SELECT id_rol FROM rol WHERE tipo='ADMINISTRADOR') WHERE"
            + " id_persona=(SELECT id_persona FROM usuario WHERE id_usuario=?)",
        usuario);
    jwt = login().body.path("token").asText();
    assertEquals(200, pedir("POST", path, Map.of("correo", "cliente@example.com"), jwt).status);
  }

  @Test
  void empleadoEliminaComprobanteRecientePeroNoFueraDePlazo() throws Exception {
    long id = reciboPrueba();
    String jwt = login().body.path("token").asText();
    jdbc.update(
        "UPDATE comprobante SET emitido_en=CURRENT_TIMESTAMP-INTERVAL '31 minutes' WHERE"
            + " id_comprobante=?",
        id);
    assertFalse(
        pedir("GET", "/comprobante/" + id, null, jwt).body.path("puedeEliminar").asBoolean());
    assertEquals(403, pedir("DELETE", "/comprobante/" + id, null, jwt).status);
    assertEquals(
        1,
        jdbc.queryForObject(
            "SELECT count(*) FROM comprobante WHERE id_comprobante=?", Integer.class, id));
    jdbc.update("UPDATE comprobante SET emitido_en=CURRENT_TIMESTAMP WHERE id_comprobante=?", id);
    assertTrue(
        pedir("GET", "/comprobante/" + id, null, jwt).body.path("puedeEliminar").asBoolean());
    assertEquals(204, pedir("DELETE", "/comprobante/" + id, null, jwt).status);
    assertEquals(
        0,
        jdbc.queryForObject(
            "SELECT count(*) FROM comprobante WHERE id_comprobante=?", Integer.class, id));
    assertEquals(400, pedir("GET", "/comprobante/" + id, null, jwt).status);
  }

  @Test
  void administradorEliminaAntiguosYClienteNoPuedeEliminar() throws Exception {
    long id = reciboPrueba();
    String path = "/comprobante/" + id;
    assertEquals(401, pedir("DELETE", path, null, null).status);
    jdbc.update(
        "UPDATE persona SET id_rol=(SELECT id_rol FROM rol WHERE tipo='CLIENTE') WHERE"
            + " id_persona=(SELECT id_persona FROM usuario WHERE id_usuario=?)",
        usuario);
    String jwt = login().body.path("token").asText();
    assertEquals(403, pedir("DELETE", path, null, jwt).status);
    jdbc.update(
        "UPDATE persona SET id_rol=(SELECT id_rol FROM rol WHERE tipo='ADMINISTRADOR') WHERE"
            + " id_persona=(SELECT id_persona FROM usuario WHERE id_usuario=?)",
        usuario);
    jdbc.update(
        "UPDATE comprobante SET emitido_en=CURRENT_TIMESTAMP-INTERVAL '1 year' WHERE"
            + " id_comprobante=?",
        id);
    jwt = login().body.path("token").asText();
    assertTrue(pedir("GET", path, null, jwt).body.path("puedeEliminar").asBoolean());
    assertEquals(204, pedir("DELETE", path, null, jwt).status);
  }

  @Test
  void pdfDescargadoTieneDisenoComunSinEstadoYNoPermiteAccesoPublico() throws Exception {
    long id = reciboPrueba();
    assertEquals(401, pedir("GET", "/comprobante/" + id + "/pdf", null, null).status);
    String jwt = login().body.path("token").asText();
    var request =
        java.net.http.HttpRequest.newBuilder(
                java.net.URI.create("http://127.0.0.1:" + port + "/comprobante/" + id + "/pdf"))
            .header("Authorization", "Bearer " + jwt)
            .GET()
            .build();
    var response = http.send(request, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
    assertEquals(200, response.statusCode());
    assertTrue(
        response.headers().firstValue("content-type").orElse("").contains("application/pdf"));
    assertTrue(response.headers().firstValue("content-disposition").orElse("").contains(".pdf"));
    try (var pdf = org.apache.pdfbox.Loader.loadPDF(response.body())) {
      String text = new org.apache.pdfbox.text.PDFTextStripper().getText(pdf);
      assertFalse(text.contains("Estado"));
      assertFalse(text.contains("ENTREGADO"));
      assertTrue(text.contains("IMPORTE TOTAL"));
    }
  }

  long empleadoRecuperacion() {
    String sufijo = java.util.UUID.randomUUID().toString();
    long persona =
        jdbc.queryForObject(
            "INSERT INTO persona(nombre,id_rol) VALUES ('Empleado recuperación',(SELECT id_rol FROM"
                + " rol WHERE tipo='EMPLEADO')) RETURNING id_persona",
            Long.class);
    return jdbc.queryForObject(
        "INSERT INTO usuario(name,email,password,id_persona) VALUES (?,?,?,?) RETURNING id_usuario",
        Long.class,
        "empleado-" + sufijo,
        "empleado-" + sufijo + "@florarte.test",
        encoder.encode("Original-empleado-1"),
        persona);
  }

  String sesionAdmin() throws Exception {
    jdbc.update(
        "UPDATE persona SET id_rol=(SELECT id_rol FROM rol WHERE tipo='ADMINISTRADOR') WHERE"
            + " id_persona=(SELECT id_persona FROM usuario WHERE id_usuario=?)",
        usuario);
    return login().body.path("token").asText();
  }

  @Test
  void soloAdministradorSolicitaRecuperacionDeEmpleado() throws Exception {
    long empleado = empleadoRecuperacion();
    String path = "/auth/recuperacion/empleado/" + empleado;
    assertEquals(401, post(path, Map.of()).status);
    String jwt = login().body.path("token").asText();
    assertEquals(403, pedir("POST", path, Map.of(), jwt).status);
    verify(correo, never()).recuperacion(anyString(), anyString());
  }

  @Test
  void administradorUsaCorreoGuardadoYEnlaceSeguroSinCambiarPasswordHastaConfirmar()
      throws Exception {
    long empleado = empleadoRecuperacion();
    String jwt = sesionAdmin();
    String
        registrado =
            jdbc.queryForObject(
                "SELECT email FROM usuario WHERE id_usuario=?", String.class, empleado),
        anterior =
            jdbc.queryForObject(
                "SELECT password FROM usuario WHERE id_usuario=?", String.class, empleado);
    assertEquals(
        200,
        pedir(
                "POST",
                "/auth/recuperacion/empleado/" + empleado,
                Map.of("correo", "otro@florarte.test"),
                jwt)
            .status);
    verify(correo).recuperacion(eq(registrado), anyString());
    assertEquals(
        anterior,
        jdbc.queryForObject(
            "SELECT password FROM usuario WHERE id_usuario=?", String.class, empleado));
    String token = enlace.substring(enlace.indexOf("#token=") + 7);
    assertEquals(200, reset(token, "Nueva-empleado-2").status);
    assertEquals(400, reset(token, "Otra-clave-3").status);
    assertTrue(
        encoder.matches(
            "Nueva-empleado-2",
            jdbc.queryForObject(
                "SELECT password FROM usuario WHERE id_usuario=?", String.class, empleado)));
    assertEquals(200, pedir("GET", "/auth/check-auth", null, jwt).status);
  }

  @Test
  void administradorNoEnviaParaAdministradoresCuentasInactivasONoExistentes() throws Exception {
    String jwt = sesionAdmin();
    assertEquals(
        400, pedir("POST", "/auth/recuperacion/empleado/" + usuario, Map.of(), jwt).status);
    long empleado = empleadoRecuperacion();
    jdbc.update("UPDATE usuario SET estado=FALSE WHERE id_usuario=?", empleado);
    assertEquals(
        400, pedir("POST", "/auth/recuperacion/empleado/" + empleado, Map.of(), jwt).status);
    assertEquals(
        400,
        pedir("POST", "/auth/recuperacion/empleado/9223372036854775807", Map.of(), jwt).status);
    verify(correo, never()).recuperacion(anyString(), anyString());
  }

  @Test
  void solicitudesAdministrativasRespetanLimitePorEmpleado() throws Exception {
    long empleado = empleadoRecuperacion();
    String jwt = sesionAdmin();
    String path = "/auth/recuperacion/empleado/" + empleado;
    for (int i = 0; i < 3; i++) assertEquals(200, pedir("POST", path, Map.of(), jwt).status);
    assertEquals(429, pedir("POST", path, Map.of(), jwt).status);
    assertEquals(
        1,
        jdbc.queryForObject(
            "SELECT count(*) FROM recuperacion_password WHERE id_usuario=? AND NOT utilizado",
            Integer.class,
            empleado));
  }
}
