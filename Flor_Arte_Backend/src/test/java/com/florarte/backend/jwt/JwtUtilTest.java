package com.florarte.backend.jwt;

import static org.junit.jupiter.api.Assertions.*;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

class JwtUtilTest {
  private static final String SECRET = "jwt-test-secret-with-more-than-thirty-two-bytes";
  private JwtUtil jwt;

  @BeforeEach
  void preparar() {
    jwt = new JwtUtil();
    ReflectionTestUtils.setField(jwt, "secret", SECRET);
    ReflectionTestUtils.setField(jwt, "expiration", 300);
  }

  @Test
  void emiteTokenConClaimsRequeridosYRolCorrespondiente() {
    var details = usuario("ROLE_EMPLEADO");
    String token = jwt.generateTokenClaims("empleado@example.test", "EMPLEADO", 4);

    assertTrue(jwt.validateToken(token, details));
    assertEquals(4, ((Number) jwt.extractAllClaims(token).get("authVersion")).longValue());
  }

  @Test
  void rechazaTokenSinClaimsRequeridosYTokenConRolDiferente() {
    var details = usuario("ROLE_EMPLEADO");
    String sinClaims = Jwts.builder()
        .subject("empleado@example.test")
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + 60_000))
        .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
        .compact();

    assertFalse(jwt.validateToken(sinClaims, details));
    assertFalse(jwt.validateToken(
        jwt.generateTokenClaims("empleado@example.test", "ADMINISTRADOR", 4), details));
  }

  @Test
  void rechazaFirmaDeOtraClave() {
    var token = Jwts.builder()
        .subject("empleado@example.test")
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + 60_000))
        .signWith(Keys.hmacShaKeyFor("different-test-secret-that-is-also-long-enough".getBytes(StandardCharsets.UTF_8)))
        .compact();

    assertThrows(io.jsonwebtoken.JwtException.class, () -> jwt.validateToken(token, usuario("ROLE_EMPLEADO")));
  }

  @Test
  void rechazaVersionNegativaAlEmitir() {
    assertThrows(IllegalArgumentException.class,
        () -> jwt.generateTokenClaims("empleado@example.test", "EMPLEADO", -1));
  }

  private User usuario(String authority) {
    return new User("empleado@example.test", "unused", List.of(new SimpleGrantedAuthority(authority)));
  }
}
