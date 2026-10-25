package com.florarte.backend.config;

import java.sql.*;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.callback.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** V4 permanece intacta. Sus cuentas solo se retiran de una instalacion nueva, antes del commit. */
@Component
@Profile("prod")
public class SemillasProduccion implements Callback {
  @Override public boolean supports(Event event,Context ctx) {
    if(event==Event.AFTER_MIGRATE)return true;
    return (event==Event.BEFORE_EACH_MIGRATE || event==Event.AFTER_EACH_MIGRATE)
        && ctx.getMigrationInfo()!=null && ctx.getMigrationInfo().getVersion()!=null
        && "4".equals(ctx.getMigrationInfo().getVersion().toString());
  }
  @Override public boolean canHandleInTransaction(Event event,Context ctx) {return true;}
  @Override public String getCallbackName() {return "florarte-semillas-produccion";}
  @Override public void handle(Event event,Context ctx) {
    try {
      Connection c=ctx.getConnection();
      if(event==Event.AFTER_MIGRATE){verificarHashesIniciales(c);return;}
      if(c.getAutoCommit()) throw new SQLException("V4 debe ejecutarse en una transaccion");
      try(var st=c.createStatement()) {
        if(event==Event.BEFORE_EACH_MIGRATE) {
          st.execute("LOCK TABLE public.usuario,public.persona IN ACCESS EXCLUSIVE MODE");
          if(contar(st,"usuario")!=0||contar(st,"persona")!=0)
            throw new SQLException("V4 pendiente con personas o usuarios existentes; se requiere revision manual");
        } else {
          if(contar(st,"usuario")!=2||contar(st,"persona")!=2)
            throw new SQLException("Contenido inesperado de V4; inicializacion bloqueada");
          // Nadie pudo insertar entre la comprobacion previa y estas eliminaciones: se conserva el bloqueo.
          st.executeUpdate("DELETE FROM public.usuario");
          st.executeUpdate("DELETE FROM public.persona");
        }
      }
    } catch(SQLException ex) {throw new FlywayException("Inicializacion de produccion bloqueada de forma segura",ex);}
  }
  private long contar(java.sql.Statement st,String tabla) throws SQLException {
    try(var rs=st.executeQuery("SELECT count(*) FROM public."+tabla)) {rs.next();return rs.getLong(1);}
  }

  private void verificarHashesIniciales(Connection c) throws SQLException {
    java.util.Set<String> semillas=new java.util.HashSet<>();
    try {
      String v4=new org.springframework.core.io.ClassPathResource("db/migration/V4__insertar_datos_iniciales.sql")
          .getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
      var matcher=java.util.regex.Pattern.compile("\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}").matcher(v4);
      while(matcher.find())semillas.add(matcher.group());
    }catch(java.io.IOException ex){throw new SQLException("No se pudo verificar la politica de semillas");}
    if(semillas.size()!=2)throw new SQLException("V4 inesperada; se requiere revision manual");
    try(var st=c.createStatement();var rs=st.executeQuery("SELECT password FROM public.usuario")){
      while(rs.next())if(semillas.contains(rs.getString(1)))
        throw new SQLException("Persisten credenciales de demostracion; revisar las cuentas antes de activar prod, sin cambios automaticos");
    }
  }
}
