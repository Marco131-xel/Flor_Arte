package com.florarte.backend.config;

import java.nio.file.Path;
import com.florarte.backend.services.PrimerAdministradorService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;

@Configuration(proxyBeanMethods=false)
@Profile("prod")
public class PrimerAdministradorConfig {
  @Bean
  @ConditionalOnProperty(name="florarte.bootstrap.enabled",havingValue="true")
  ApplicationRunner primerAdministrador(PrimerAdministradorService service,
      @Value("${florarte.bootstrap.email}") String correo,
      @Value("${florarte.bootstrap.nombre}") String nombre,
      @Value("${florarte.bootstrap.hash-file}") String archivo) {
    return args -> service.crear(correo,nombre,Path.of(archivo));
  }
}
