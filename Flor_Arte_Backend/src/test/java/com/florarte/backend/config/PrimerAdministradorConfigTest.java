package com.florarte.backend.config;
import com.florarte.backend.services.PrimerAdministradorService;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.DefaultApplicationArguments;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class PrimerAdministradorConfigTest {
  @Test void desactivadoNoRegistraBootstrap(){
    new ApplicationContextRunner().withUserConfiguration(PrimerAdministradorConfig.class)
        .withPropertyValues("spring.profiles.active=prod","florarte.bootstrap.enabled=false")
        .run(c->assertTrue(c.getBeansOfType(ApplicationRunner.class).isEmpty()));
  }
  @Test void habilitadoUsaServicioConArchivoExterno() throws Exception {
    var service=mock(PrimerAdministradorService.class);
    new ApplicationContextRunner().withUserConfiguration(PrimerAdministradorConfig.class)
        .withBean(PrimerAdministradorService.class,()->service)
        .withPropertyValues("spring.profiles.active=prod","florarte.bootstrap.enabled=true",
          "florarte.bootstrap.email=admin@example.invalid","florarte.bootstrap.nombre=Administrador",
          "florarte.bootstrap.hash-file=/run/secrets/hash-prueba")
        .run(c->{assertNull(c.getStartupFailure());c.getBean(ApplicationRunner.class).run(new DefaultApplicationArguments());});
    verify(service).crear("admin@example.invalid","Administrador",Path.of("/run/secrets/hash-prueba"));
  }
}
