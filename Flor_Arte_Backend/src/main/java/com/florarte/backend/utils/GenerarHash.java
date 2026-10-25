package com.florarte.backend.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerarHash {

    public static void main(String[] args) {
        var console = System.console();
        if (console == null) {
            throw new IllegalStateException("Se requiere una terminal interactiva para capturar la contraseña");
        }

        char[] password = console.readPassword("Contraseña: ");
        char[] confirmation = console.readPassword("Confirma la contraseña: ");
        try {
            byte[] encoded = new String(password).getBytes(StandardCharsets.UTF_8);
            if (!MessageDigest.isEqual(encoded, new String(confirmation).getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Las contraseñas no coinciden");
            }
            if (password.length < 8 || encoded.length > 72) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres y no superar 72 bytes UTF-8");
            }
            System.out.println(new BCryptPasswordEncoder(12).encode(new String(password)));
        } finally {
            java.util.Arrays.fill(password, '\0');
            java.util.Arrays.fill(confirmation, '\0');
        }
    }
}
