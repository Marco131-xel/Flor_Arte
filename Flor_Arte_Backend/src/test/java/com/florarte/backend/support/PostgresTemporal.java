package com.florarte.backend.support;

import java.sql.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.DynamicPropertyRegistry;

/** Solo acepta el cluster Docker previamente identificado por el verificador externo. */
public final class PostgresTemporal {
  public static final String RECURSO = "florarte-postgres-temporal";
  private PostgresTemporal() {}

  public static String url() {
    String url = System.getProperty("florarte.test.db");
    Assumptions.assumeTrue(url != null, "Integracion omitida: falta florarte.test.db");
    if (!url.matches("jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/florarte_test"))
      throw new IllegalStateException("Solo se permite PostgreSQL local florarte_test sin parametros");
    return url;
  }
  public static String password() { return requerida("FLORARTE_TEST_DB_PASSWORD"); }
  private static String requerida(String nombre) {
    String valor = System.getenv(nombre);
    if (valor == null || valor.isBlank()) throw new IllegalStateException("Falta " + nombre);
    return valor;
  }
  private static String identificador() {
    String id = requerida("FLORARTE_TEST_DB_SYSTEM_IDENTIFIER");
    if (!id.matches("[0-9]{1,20}") || !requerida("FLORARTE_TEST_DB_CONTAINER_ID").matches("[a-f0-9]{64}"))
      throw new IllegalStateException("Ejecuta primero el verificador del contenedor temporal");
    return id;
  }
  private static void verificar(Connection c) throws SQLException { verificar(c,identificador()); }
  static void verificar(Connection c,String esperado) throws SQLException {
    try (var st = c.createStatement(); var rs = st.executeQuery(
        "SELECT current_database(),current_user,system_identifier::text FROM pg_control_system()")) {
      if (!rs.next() || !"florarte_test".equals(rs.getString(1)) || !"florarte_test".equals(rs.getString(2))
          || !esperado.equals(rs.getString(3))) {
        c.close();
        throw new SQLException("Identidad PostgreSQL temporal incorrecta; operacion bloqueada");
      }
    }
  }
  public static DriverManagerDataSource datasource() {
    String url = url(), password = password(); identificador();
    return new DriverManagerDataSource(url, "florarte_test", password) {
      @Override public Connection getConnection() throws SQLException {
        Connection c = super.getConnection();
        try { verificar(c); return c; } catch (SQLException | RuntimeException ex) { c.close(); throw ex; }
      }
      @Override public Connection getConnection(String u, String p) throws SQLException {
        Connection c = super.getConnection(u,p);
        try { verificar(c); return c; } catch (SQLException | RuntimeException ex) { c.close(); throw ex; }
      }
    };
  }
  public static void registrar(DynamicPropertyRegistry props) {
    var ds = datasource();
    try (var c = ds.getConnection()) { verificar(c); }
    catch (SQLException ex) { throw new IllegalStateException("No se verifico PostgreSQL temporal", ex); }
    props.add("spring.datasource.url", PostgresTemporal::url);
    props.add("spring.datasource.username", () -> "florarte_test");
    props.add("spring.datasource.password", PostgresTemporal::password);
    // Hikari verifica cada conexion fisica nueva, tambien si cambia el puerto del host.
    String init = "SELECT 1 / CASE WHEN current_database()='florarte_test' AND current_user='florarte_test' AND (SELECT system_identifier::text FROM pg_control_system())='" + identificador() + "' THEN 1 ELSE 0 END";
    props.add("spring.datasource.hikari.connection-init-sql", () -> init);
  }
  public static void esquemaVacio(DriverManagerDataSource ds) {
    try (var c = ds.getConnection(); var st = c.createStatement()) {
      verificar(c);
      st.execute("DROP SCHEMA public CASCADE"); st.execute("CREATE SCHEMA public");
    } catch (SQLException ex) { throw new IllegalStateException("No se pudo preparar el esquema temporal",ex); }
  }
  public static void reiniciar(DriverManagerDataSource ds) {
    esquemaVacio(ds);
    Flyway.configure().dataSource(ds).baselineOnMigrate(false).cleanDisabled(true).load().migrate();
  }
}
