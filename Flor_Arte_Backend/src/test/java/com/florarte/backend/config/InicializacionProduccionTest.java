package com.florarte.backend.config;

import com.florarte.backend.support.PostgresTemporal;
import com.florarte.backend.services.PrimerAdministradorService;
import java.nio.file.*;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.callback.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfSystemProperty(named="florarte.test.db",matches="jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/florarte_test")
@ResourceLock(PostgresTemporal.RECURSO)
class InicializacionProduccionTest {
  static org.springframework.jdbc.datasource.DriverManagerDataSource ds;
  JdbcTemplate jdbc;
  @TempDir Path tmp;
  @BeforeAll static void conectar(){ds=PostgresTemporal.datasource();}
  @BeforeEach void preparar(){PostgresTemporal.esquemaVacio(ds);jdbc=new JdbcTemplate(ds);}
  Flyway flyway(Callback... callbacks){return Flyway.configure().dataSource(ds).cleanDisabled(true).callbacks(callbacks).load();}
  long contar(String tabla){return jdbc.queryForObject("SELECT count(*) FROM "+tabla,Long.class);}
  @Test void nuevaProduccionNoExponeSemillasNiDatosPersonalesYConservaHistorial(){
    var guard=new SemillasProduccion();
    var observador=new Callback(){
      public boolean supports(Event e,Context c){return e==Event.AFTER_EACH_MIGRATE&&c.getMigrationInfo().getVersion()!=null&&"4".equals(c.getMigrationInfo().getVersion().toString());}
      public boolean canHandleInTransaction(Event e,Context c){return true;}
      public String getCallbackName(){return "aaa-observar-transaccion-v4";}
      public void handle(Event e,Context c){
        try(var conn=ds.getConnection();var st=conn.createStatement()){
          assertFalse(c.getConnection().getAutoCommit());
          st.execute("SET lock_timeout='200ms'");
          // El bloqueo impide leer cuentas de V4 antes de que el callback las retire.
          var ex=assertThrows(java.sql.SQLException.class,()->st.executeQuery("SELECT count(*) FROM usuario"));
          assertEquals("55P03",ex.getSQLState());
        }catch(java.sql.SQLException ex){throw new RuntimeException(ex);}
      }
    };
    flyway(guard,observador).migrate();
    assertEquals(0,contar("usuario"));assertEquals(0,contar("persona"));assertEquals(4,contar("rol"));
    assertEquals(19,contar("flyway_schema_history"));
    assertEquals(0,flyway(guard).migrate().migrationsExecuted);
  }
  @Test void instalacionExistenteBloqueaHashesDemoSinCambiarUsuarios(){
    flyway().migrate();
    String antes=jdbc.queryForObject("SELECT md5(string_agg(row_to_json(u)::text,'' ORDER BY id_usuario)) FROM usuario u",String.class);
    assertThrows(RuntimeException.class,()->flyway(new SemillasProduccion()).migrate());
    assertEquals(antes,jdbc.queryForObject("SELECT md5(string_agg(row_to_json(u)::text,'' ORDER BY id_usuario)) FROM usuario u",String.class));
  }
  @Test void v4PendienteConDatosExistentesSeBloqueaSinEliminarPersonas(){
    Flyway.configure().dataSource(ds).target("3").load().migrate();
    jdbc.update("INSERT INTO rol(tipo) VALUES ('ADMINISTRADOR')");
    jdbc.update("INSERT INTO persona(nombre,id_rol) VALUES ('Persona existente de prueba',1)");
    assertThrows(RuntimeException.class,()->flyway(new SemillasProduccion()).migrate());
    assertEquals(1,contar("persona"));assertEquals(0,contar("usuario"));
  }
  @Test void primerAdministradorSoloEnBaseNuevaYHashFuerteSinSobrescritura() throws Exception {
    flyway(new SemillasProduccion()).migrate();
    Path file=tmp.resolve("hash");String hash=new BCryptPasswordEncoder(12).encode("Clave-sintetica-exclusiva-de-pruebas");Files.writeString(file,hash);
    var service=new PrimerAdministradorService(jdbc);var tx=new TransactionTemplate(new DataSourceTransactionManager(ds));
    tx.executeWithoutResult(s->{try{service.crear("admin@example.invalid","Administrador de prueba",file);}catch(Exception e){throw new RuntimeException(e);}});
    assertEquals(1,contar("usuario"));assertEquals(1,contar("persona"));
    assertEquals(hash,jdbc.queryForObject("SELECT password FROM usuario",String.class));
    assertThrows(RuntimeException.class,()->tx.executeWithoutResult(s->{try{service.crear("otro@example.invalid","Otro",file);}catch(Exception e){throw new RuntimeException(e);}}));
    assertEquals(1,contar("usuario"));
    Files.writeString(file,"texto plano");
    assertThrows(IllegalArgumentException.class,()->service.crear("admin@example.invalid","Administrador",file));
  }
}
