package com.florarte.backend.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration}")
  private int expiration;

  @jakarta.annotation.PostConstruct
  public void validarConfiguracion() {
    if (secret.getBytes(StandardCharsets.UTF_8).length < 32 || expiration < 1 || expiration > 3600)
      throw new IllegalStateException("JWT_SECRET requiere al menos 32 bytes y JWT_EXPIRATION entre 1 y 3600 segundos");
  }

  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  public String generateTokenClaims(String correo, String tipoUsuario, long version) {
    if (correo == null || correo.isBlank() || tipoUsuario == null || tipoUsuario.isBlank() || version < 0) {
      throw new IllegalArgumentException("El token requiere sujeto, rol y versión de autenticación válidos");
    }
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", tipoUsuario);
    claims.put("authVersion", version);

    return Jwts.builder()
        .claims(claims)
        .subject(correo)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + (expiration * 1000L)))
        .signWith(getSigningKey())
        .compact();
  }

  // Validar token
  public Boolean validateToken(String token, UserDetails userDetails) {
    Claims claims = extractAllClaims(token);
    Object version = claims.get("authVersion");
    Object role = claims.get("role");
    boolean versionValida = (version instanceof Integer || version instanceof Long)
        && ((Number) version).longValue() >= 0;
    boolean rolValido = role instanceof String rol && !rol.isBlank()
        && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + rol));
    return claims.getSubject() != null
        && !claims.getSubject().isBlank()
        && claims.getSubject().equals(userDetails.getUsername())
        && claims.getIssuedAt() != null
        && claims.getExpiration() != null
        && claims.getExpiration().after(new Date())
        && versionValida
        && rolValido;
  }

  // Verificar expiración
  public Boolean isTokenExpired(String token) {
    return extractExpiration(token).before(new Date());
  }

  public Date extractExpiration(String token) {
    return extractAllClaims(token).getExpiration();
  }

  // Obtener todos los claims - CORREGIDO para JJWT 0.12.x
  public Claims extractAllClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }

  // Obtener el correo del usuario
  public String extractUserName(String token) {
    return extractAllClaims(token).getSubject();
  }

  // Extraer el rol
  public String extractRole(String token) {
    Claims claims = extractAllClaims(token);
    return (String) claims.get("role");
  }
}
