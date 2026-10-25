package com.florarte.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.junit.jupiter.api.Assertions.*;

class ProduccionSeguraTest {
  MockEnvironment entorno() {
    var e=new MockEnvironment();
    e.withProperty("jwt.secret","jwt-de-prueba-independiente-01234567890123456789")
      .withProperty("florarte.auth.code-secret","otp-de-prueba-independiente-01234567890123456789")
      .withProperty("florarte.auth.recovery-url","https://app.example/restablecer-contrasena")
      .withProperty("CORS_ALLOWED_ORIGINS","https://app.example,https://otra.example")
      .withProperty("spring.datasource.url","jdbc:postgresql://db/florarte")
      .withProperty("spring.datasource.username","prueba").withProperty("spring.datasource.password","solo-prueba")
      .withProperty("spring.mail.username","smtp@example.invalid").withProperty("spring.mail.password","solo-prueba")
      .withProperty("florarte.mail.from","smtp@example.invalid")
      .withProperty("spring.jpa.hibernate.ddl-auto","validate").withProperty("spring.jpa.show-sql","false")
      .withProperty("spring.flyway.enabled","true").withProperty("spring.flyway.baseline-on-migrate","false")
      .withProperty("spring.flyway.clean-disabled","true").withProperty("spring.flyway.validate-on-migrate","true");
    return e;
  }
  @Test void aceptaConfiguracionExternaValida(){assertDoesNotThrow(()->ProduccionSegura.validar(entorno()));}
  @Test void rechazaSecretosIgualesOCortos(){
    var e=entorno().withProperty("florarte.auth.code-secret",entorno().getProperty("jwt.secret"));
    assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(e));
    assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty("jwt.secret","corta")));
  }
  @Test void rechazaRecuperacionHttpYCredencialesEnUrl(){
    for(String url:new String[]{"http://app.example/reset","https://user:password@app.example/reset","https://app.example/reset?q=1","https://localhost/reset"})
      assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty("florarte.auth.recovery-url",url)));
  }
  @Test void rechazaCorsWildcardHttpRutaYOriGenVacio(){
    for(String origin:new String[]{"*","http://app.example","https://app.example/ruta","https://app.example,",""})
      assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty("CORS_ALLOWED_ORIGINS",origin)));
  }
  @Test void rechazaSqlLoggingDdlPeligrosoYFlywayInseguro(){
    for(String key:new String[]{"spring.jpa.show-sql","spring.flyway.baseline-on-migrate"})
      assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty(key,"true")));
    for(String key:new String[]{"spring.flyway.enabled","spring.flyway.clean-disabled","spring.flyway.validate-on-migrate"})
      assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty(key,"false")));
    assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty("spring.jpa.hibernate.ddl-auto","create")));
  }
  @Test void rechazaCredencialesVaciasYPlaceholders(){
    for(String key:new String[]{"spring.datasource.password","spring.mail.username","spring.mail.password","florarte.mail.from"})
      assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty(key,"")));
    assertThrows(IllegalStateException.class,()->ProduccionSegura.validar(entorno().withProperty("jwt.secret","${JWT_SECRET}")));
  }
}
