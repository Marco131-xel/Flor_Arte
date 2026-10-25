package com.florarte.backend.config;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods=false)
@Profile("prod")
public class ProduccionSegura {
  @Bean InitializingBean validarProduccion(Environment env) {
    return () -> validar(env);
  }
  public static void validar(Environment env) {
    String jwt=requerida(env,"jwt.secret"), otp=requerida(env,"florarte.auth.code-secret");
    if(jwt.getBytes(StandardCharsets.UTF_8).length<32 || otp.getBytes(StandardCharsets.UTF_8).length<32 || jwt.equals(otp))
      throw new IllegalStateException("JWT y 2FA requieren secretos independientes de al menos 32 bytes");
    https(requerida(env,"florarte.auth.recovery-url"));
    for(String origen:requerida(env,"CORS_ALLOWED_ORIGINS").split(",",-1)) {
      URI uri=https(origen.strip());
      if(uri.getPath()!=null&&!uri.getPath().isEmpty()) throw new IllegalStateException("CORS solo acepta origenes HTTPS sin ruta");
    }
    for(String clave:new String[]{"spring.datasource.url","spring.datasource.username","spring.datasource.password","spring.mail.username","spring.mail.password","florarte.mail.from"}) requerida(env,clave);
    if(!"validate".equals(env.getProperty("spring.jpa.hibernate.ddl-auto"))
        || env.getProperty("spring.jpa.show-sql",Boolean.class,false)
        || !env.getProperty("spring.flyway.enabled",Boolean.class,false)
        || env.getProperty("spring.flyway.baseline-on-migrate",Boolean.class,true)
        || !env.getProperty("spring.flyway.clean-disabled",Boolean.class,false)
        || !env.getProperty("spring.flyway.validate-on-migrate",Boolean.class,false))
      throw new IllegalStateException("Produccion requiere validate, Flyway seguro y SQL logging deshabilitado");
  }
  private static String requerida(Environment env,String nombre) {
    String valor;
    try { valor=env.getProperty(nombre); }
    catch (RuntimeException ex) { throw new IllegalStateException("Configuracion obligatoria invalida: "+nombre); }
    if(valor==null||valor.isBlank()||valor.contains("${"))throw new IllegalStateException("Falta configuracion obligatoria: "+nombre);
    return valor;
  }
  private static URI https(String valor) {
    try {
      URI uri=URI.create(valor);
      if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getHost().contains("*")
          || Arrays.asList("localhost","127.0.0.1","::1","[::1]").contains(uri.getHost())
          || uri.getUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null)
        throw new IllegalArgumentException();
      return uri;
    } catch(IllegalArgumentException ex) {throw new IllegalStateException("Produccion requiere URL HTTPS externa sin credenciales, query o fragmento");}
  }
}
