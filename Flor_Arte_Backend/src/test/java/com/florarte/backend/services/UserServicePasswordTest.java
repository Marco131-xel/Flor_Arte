package com.florarte.backend.services;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import com.florarte.backend.dtos.NewUserDto;
import com.florarte.backend.repositories.PersonaRepository;
import com.florarte.backend.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class UserServicePasswordTest {
  private final UserService service = new UserService(
      mock(UserRepository.class), mock(PersonaRepository.class), new BCryptPasswordEncoder());

  @Test
  void rechazaContrasenaCortaAntesDeConsultarPersona() {
    var dto = new NewUserDto("usuario", "usuario@example.test", "corta7", 1L);

    assertThrows(IllegalArgumentException.class, () -> service.createUser(dto));
  }

  @Test
  void rechazaContrasenaQueSuperaLimiteUtf8DeBcrypt() {
    var dto = new NewUserDto("usuario", "usuario@example.test", "á".repeat(37), 1L);

    assertThrows(IllegalArgumentException.class, () -> service.createUser(dto));
  }
}
