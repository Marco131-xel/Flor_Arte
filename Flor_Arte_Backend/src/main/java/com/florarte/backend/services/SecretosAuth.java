package com.florarte.backend.services;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SecretosAuth {
  private final byte[] clave;

  public SecretosAuth(@Value("${florarte.auth.code-secret}") String clave,
      @Value("${jwt.secret}") String jwtSecret) {
    if (clave.equals(jwtSecret)) throw new IllegalStateException("AUTH_CODE_SECRET debe ser distinto de JWT_SECRET");
    if (clave.getBytes(StandardCharsets.UTF_8).length < 32)
      throw new IllegalStateException("AUTH_CODE_SECRET debe tener al menos 32 bytes");
    this.clave = clave.getBytes(StandardCharsets.UTF_8);
  }

  public String hmac(String valor) {
    try {
      var mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(clave, "HmacSHA256"));
      return HexFormat.of().formatHex(mac.doFinal(valor.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("No se pudo calcular la protección del desafío");
    }
  }

  public static String hash(String valor) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(valor.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("No se pudo proteger el token");
    }
  }

  public boolean coincide(String a, String b) {
    return MessageDigest.isEqual(
        a.getBytes(StandardCharsets.US_ASCII), b.getBytes(StandardCharsets.US_ASCII));
  }
}
