package com.florarte.backend.services;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("reglasEdicion")
public class ReglasEdicion {
    private final JdbcTemplate jdbc;
    private final Clock reloj;
    @Autowired
    public ReglasEdicion(JdbcTemplate jdbc) { this(jdbc, Clock.systemUTC()); }
    ReglasEdicion(JdbcTemplate jdbc, Clock reloj) { this.jdbc = jdbc; this.reloj = reloj; }
    private boolean tieneRol(String rol) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + rol));
    }
    public boolean administrador() { return tieneRol("ADMINISTRADOR"); }
    public boolean empleado() { return tieneRol("EMPLEADO"); }
    public Instant ahora() { return reloj.instant(); }
    public boolean dentroDePlazo(Instant creado) {
        Instant instante = ahora();
        return creado != null && !creado.isAfter(instante) && instante.isBefore(creado.plusSeconds(1800));
    }
    private String[] tabla(String tipo) {
        return switch(tipo) {
            case "arreglos" -> new String[]{"arreglo", "id_arreglo"};
            case "pedidosArreglos" -> new String[]{"pedido_arreglo", "id_pedido_arreglo"};
            case "flores" -> new String[]{"flor", "id_flor"};
            case "inventario" -> new String[]{"entrada_inventario", "id_entrada"};
            case "pedidos" -> new String[]{"pedido", "id_pedido"};
            case "mermas" -> new String[]{"movimiento_inventario", "id_movimiento_inventario"};
            default -> throw new IllegalArgumentException("Módulo no válido");
        };
    }
    public Instant creado(String tipo, Number id) {
        var t = tabla(tipo);
        var resultados = jdbc.query("SELECT creado_en FROM " + t[0] + " WHERE " + t[1] + " = ?",
            (rs, n) -> rs.getTimestamp(1).toInstant(), id);
        if (resultados.isEmpty()) throw new IllegalArgumentException("Registro no encontrado");
        return resultados.getFirst();
    }
    public boolean editar(String tipo, Number id) {
        if (administrador()) return true;
        return empleado() && dentroDePlazo(creado(tipo, id));
    }
    public boolean detalle(String tipo, Number id) {
        if (!tipo.equals("pedidos") && !tipo.equals("inventario")) return false;
        String tabla = tipo.equals("pedidos") ? "detalle_pedido" : "detalle_entrada";
        String clave = tipo.equals("pedidos") ? "id_detalle_pedido" : "id_detalle_entrada";
        String padre = tipo.equals("pedidos") ? "id_pedido" : "id_entrada";
        var ids = jdbc.queryForList("SELECT " + padre + " FROM " + tabla + " WHERE " + clave + " = ?", Integer.class, id);
        return !ids.isEmpty() && editar(tipo, ids.getFirst());
    }
    public boolean merma(Number id, String motivo, String tipo) {
        if (administrador()) return true;
        Integer cantidad = jdbc.queryForObject("SELECT count(*) FROM movimiento_inventario WHERE id_movimiento_inventario = ? AND motivo = 'MERMA' AND tipo_movimiento = 'SALIDA'", Integer.class, id);
        return cantidad != null && cantidad == 1 && "MERMA".equals(motivo) && "SALIDA".equals(tipo) && editar("mermas", id);
    }
    public Map<String, Object> permiso(String tipo, Number id) {
        Instant fecha = creado(tipo, id);
        return Map.of("puedeEditar", administrador() || (empleado() && dentroDePlazo(fecha)),
            "editableHasta", fecha.plusSeconds(1800).toString(), "horaServidor", ahora().toString());
    }
}
