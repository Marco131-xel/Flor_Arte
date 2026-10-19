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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration}")
  private int expiration;

  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  // Método sin claims
  public String generateToken(Authentication authentication) {
    UserDetails mainUser = (UserDetails) authentication.getPrincipal();
    return Jwts.builder()
        .subject(mainUser.getUsername())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + expiration * 1000L))
        .signWith(getSigningKey())
        .compact();
  }

  // Método para incluir claims
  public String generateTokenClaims(String correo, String tipoUsuario) {
    return generateTokenClaims(correo, tipoUsuario, 0L);
  }

  public String generateTokenClaims(String correo, String tipoUsuario, long version) {
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
    final String userName = extractUserName(token);
    return (userName.equals(userDetails.getUsername()) && !isTokenExpired(token));
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
