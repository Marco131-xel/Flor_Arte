package com.florarte.backend.services;

import java.time.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ReglasEdicionTest {
    @Test void limiteExactoDeTreintaMinutos() {
        Instant ahora=Instant.parse("2026-10-05T12:00:00Z");
        ReglasEdicion reglas=new ReglasEdicion(null, Clock.fixed(ahora, ZoneOffset.UTC));
        assertTrue(reglas.dentroDePlazo(ahora.minusSeconds(1799)));
        assertFalse(reglas.dentroDePlazo(ahora.minusSeconds(1800)));
        assertFalse(reglas.dentroDePlazo(ahora.plusSeconds(1)));
        assertFalse(reglas.dentroDePlazo(null));
    }
}
