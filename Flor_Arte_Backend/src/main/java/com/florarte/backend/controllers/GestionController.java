package com.florarte.backend.controllers;

import com.florarte.backend.services.ReglasEdicion;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.YearMonth;
import java.time.DateTimeException;
import java.util.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/gestion")
@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'EMPLEADO')")
public class GestionController {
    private final NamedParameterJdbcTemplate jdbc;
    private final ReglasEdicion reglas;
    public GestionController(NamedParameterJdbcTemplate jdbc, ReglasEdicion reglas) {
        this.jdbc = jdbc; this.reglas = reglas;
    }
    private record Consulta(String campos, String tablas, String id, String nombre, String busqueda,
                            String fecha, String importe, String unidades, String creado, String inicial) {}
    private Consulta consulta(String tipo) {
        return switch(tipo) {
            case "tipoflor" -> new Consulta("t.id_tipo_flor AS id, t.nombre, t.descripcion, t.imagen_url AS imagen",
                "tipo_flor t", "t.id_tipo_flor", "t.nombre", "concat(t.nombre, ' ', t.descripcion)", null, null, null, null, "1=1");
            case "flores" -> new Consulta("f.id_flor AS id, t.nombre AS nombre, c.nombre AS secundario, f.precio, f.stock, f.estado, t.imagen_url AS imagen",
                "flor f JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color", "f.id_flor", "t.nombre",
                "concat(t.nombre, ' ', c.nombre, ' ', f.id_flor)", null, "f.precio * f.stock", "f.stock", "f.creado_en", "1=1");
            case "pedidos" -> new Consulta("p.id_pedido AS id, c.nombre AS nombre, e.nombre AS secundario, p.estado, p.total, p.fecha",
                "pedido p JOIN persona c ON c.id_persona=p.id_cliente LEFT JOIN persona e ON e.id_persona=p.id_empleado", "p.id_pedido", "c.nombre",
                "concat(c.nombre, ' ', e.nombre, ' ', p.id_pedido)", "p.fecha", "p.total", null, "p.creado_en", "1=1");
            case "inventario" -> new Consulta("i.id_entrada AS id, p.nombre, i.total, i.fecha",
                "entrada_inventario i JOIN persona p ON p.id_persona=i.id_persona", "i.id_entrada", "p.nombre",
                "concat(p.nombre, ' ', i.id_entrada)", "i.fecha", "i.total", null, "i.creado_en", "1=1");
            case "mermas" -> new Consulta("m.id_movimiento_inventario AS id, concat(t.nombre, ' ', c.nombre) AS nombre, m.cantidad, m.fecha, m.motivo, m.id_flor AS \"idFlor\"",
                "movimiento_inventario m JOIN flor f ON f.id_flor=m.id_flor JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color",
                "m.id_movimiento_inventario", "t.nombre", "concat(t.nombre, ' ', c.nombre, ' ', m.id_movimiento_inventario)", "m.fecha", null, "m.cantidad", "m.creado_en", "m.motivo='MERMA' AND m.tipo_movimiento='SALIDA'");
            case "personas" -> new Consulta("p.id_persona AS id, p.nombre, p.correo, p.telefono, p.dpi, r.tipo AS rol",
                "persona p JOIN rol r ON r.id_rol=p.id_rol", "p.id_persona", "p.nombre", "concat(p.nombre, ' ', p.correo, ' ', p.telefono, ' ', p.dpi)",
                null, null, null, null, reglas.administrador() ? "1=1" : "r.tipo IN ('CLIENTE','PROVEEDOR')");
            case "usuarios" -> {
                if (!reglas.administrador()) throw new AccessDeniedException("Solo administradores");
                yield new Consulta("u.id_usuario AS id, p.nombre, u.name AS secundario, u.email AS correo, u.estado, r.tipo AS rol, p.id_persona AS \"idPersona\"",
                    "usuario u JOIN persona p ON p.id_persona=u.id_persona JOIN rol r ON r.id_rol=p.id_rol", "u.id_usuario", "p.nombre",
                    "concat(p.nombre, ' ', u.name, ' ', u.email)", null, null, null, null, "1=1");
            }
            default -> throw new IllegalArgumentException("Módulo no válido");
        };
    }
    @GetMapping("/{tipo}/pagina")
    public Map<String, Object> pagina(@PathVariable String tipo,
            @RequestParam(defaultValue="0") int pagina, @RequestParam(defaultValue="10") int tamano,
            @RequestParam(defaultValue="") String q, @RequestParam(defaultValue="") String mes,
            @RequestParam(defaultValue="") String estado, @RequestParam(defaultValue="") String rol,
            @RequestParam(defaultValue="recientes") String orden) {
        if (pagina < 0 || tamano < 1 || tamano > 50 || q.length() > 100) throw new IllegalArgumentException("Paginación o búsqueda no válida");
        Consulta c = consulta(tipo);
        Map<String,Object> parametros = new HashMap<>();
        String where = " WHERE " + c.inicial();
        if (!q.isBlank()) {
            where += " AND lower(" + c.busqueda() + ") LIKE :q ESCAPE '!'";
            parametros.put("q", "%" + q.strip().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_") + "%");
        }
        if (!mes.isBlank()) {
            if (c.fecha() == null) throw new IllegalArgumentException("Este listado no admite mes");
            try {
                YearMonth periodo = YearMonth.parse(mes);
                if (periodo.getYear() < 1 || periodo.getYear() > 9999) throw new IllegalArgumentException("Año fuera de rango");
                parametros.put("desde", Timestamp.valueOf(periodo.atDay(1).atStartOfDay()));
                parametros.put("hasta", Timestamp.valueOf(periodo.plusMonths(1).atDay(1).atStartOfDay()));
            } catch (DateTimeException ex) { throw new IllegalArgumentException("Mes inválido, usa AAAA-MM"); }
            where += " AND " + c.fecha() + " >= :desde AND " + c.fecha() + " < :hasta";
        }
        if (!estado.isBlank()) {
            if (tipo.equals("pedidos")) { where += " AND p.estado=:estado"; parametros.put("estado", estado); }
            else if (tipo.equals("flores")) {
                where += switch(estado) { case "activa" -> " AND f.estado=true"; case "inactiva" -> " AND f.estado=false"; case "bajo" -> " AND f.estado=true AND f.stock BETWEEN 1 AND 5"; case "agotada" -> " AND f.estado=true AND f.stock=0"; default -> throw new IllegalArgumentException("Filtro inválido"); };
            } else if (tipo.equals("usuarios")) {
                if (!Set.of("activo", "inactivo").contains(estado)) throw new IllegalArgumentException("Estado inválido");
                where += " AND u.estado=:estado"; parametros.put("estado", estado.equals("activo"));
            }
        }
        if (!rol.isBlank() && Set.of("usuarios","personas").contains(tipo)) { where += " AND r.tipo=:rol"; parametros.put("rol",rol); }
        String from = " FROM " + c.tablas() + where;
        var resumen = jdbc.queryForMap("SELECT count(*) AS registros, " + (c.importe()==null ? "0" : "coalesce(sum("+c.importe()+"),0)") + " AS importe, " + (c.unidades()==null ? "0" : "coalesce(sum("+c.unidades()+"),0)") + " AS unidades" + from, parametros);
        long total = ((Number)resumen.get("registros")).longValue();
        int paginas = (int)((total + tamano - 1) / tamano);
        int actual = Math.min(pagina, Math.max(0,paginas-1));
        parametros.put("limite", tamano); parametros.put("offset", (long)actual*tamano);
        String order = switch(orden) {
            case "nombre" -> c.nombre()+" ASC, "+c.id()+" DESC";
            case "antiguos" -> (c.fecha()==null ? c.id()+" ASC" : c.fecha()+" ASC, "+c.id()+" ASC");
            case "recientes" -> (c.fecha()==null ? c.id()+" DESC" : c.fecha()+" DESC, "+c.id()+" DESC");
            default -> throw new IllegalArgumentException("Orden no válido");
        };
        String campos=c.campos()+(c.creado()==null ? "" : ", "+c.creado()+" AS \"creadoEn\"");
        var filas=jdbc.queryForList("SELECT "+campos+from+" ORDER BY "+order+" LIMIT :limite OFFSET :offset",parametros);
        Instant ahora = reglas.ahora();
        for (var fila : filas) {
            if (fila.get("fecha") instanceof Timestamp fecha) fila.put("fecha",fecha.toLocalDateTime().toString());
            if (fila.get("creadoEn") instanceof Timestamp fecha) {
                Instant creado=fecha.toInstant();
                fila.put("creadoEn",creado.toString());
                fila.put("editableHasta",creado.plusSeconds(1800).toString());
                fila.put("puedeEditar",reglas.administrador() || reglas.dentroDePlazo(creado));
            }
        }
        return Map.of("contenido",filas,"pagina",actual,"tamano",tamano,"totalElementos",total,"totalPaginas",paginas,"resumen",resumen,"horaServidor",ahora.toString());
    }
    @GetMapping("/{tipo}/{id}/permiso")
    public Map<String,Object> permiso(@PathVariable String tipo, @PathVariable Integer id) { return reglas.permiso(tipo,id); }

    @GetMapping("/avisos")
    public List<Map<String,Object>> avisos() {
        String base = reglas.administrador() ? "/admin" : "/empleado";
        List<Map<String,Object>> resultado = new ArrayList<>();
        for (var p : jdbc.queryForList("SELECT p.id_pedido, c.nombre FROM pedido p JOIN persona c ON c.id_persona=p.id_cliente WHERE p.estado='PENDIENTE' ORDER BY p.fecha DESC,p.id_pedido DESC LIMIT 5", Map.of()))
            resultado.add(Map.of("id","pedido-"+p.get("id_pedido"),"tipo","pedido","titulo","Pedido pendiente","detalle","Pedido #"+p.get("id_pedido")+" · "+p.get("nombre"),"ruta",base+"/pedidos"));
        for (var f : jdbc.queryForList("SELECT f.id_flor,f.stock,concat(t.nombre,' ',c.nombre) AS nombre FROM flor f JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color WHERE f.estado=true AND f.stock<=5 ORDER BY f.stock,f.id_flor LIMIT 5",Map.of()))
            resultado.add(Map.of("id","stock-"+f.get("id_flor")+"-"+f.get("stock"),"tipo","stock","titulo","Stock bajo","detalle",f.get("nombre")+": "+f.get("stock")+" unidades","ruta",base+"/flores"));
        if (reglas.administrador()) {
            for (var p : jdbc.queryForList("SELECT id_pedido,estado FROM pedido WHERE id_empleado IS NULL AND estado IN ('CONFIRMADO','PREPARANDO','LISTO') ORDER BY fecha DESC,id_pedido DESC LIMIT 5",Map.of()))
                resultado.add(Map.of("id","pedido-sin-empleado-"+p.get("id_pedido")+"-"+p.get("estado"),"tipo","empleado","titulo","Pedido sin responsable","detalle","Pedido #"+p.get("id_pedido")+" · "+p.get("estado"),"ruta",base+"/pedidos"));
            for (var u : jdbc.queryForList("SELECT id_usuario,name FROM usuario WHERE estado=false ORDER BY id_usuario DESC LIMIT 5",Map.of()))
                resultado.add(Map.of("id","usuario-inactivo-"+u.get("id_usuario"),"tipo","usuario","titulo","Cuenta inactiva","detalle",u.get("name"),"ruta",base+"/usuarios"));
        }
        return resultado;
    }
    @GetMapping("/resumen")
    public Map<String,Object> resumen() {
        Map<String,Object> resultado=new HashMap<>();
        resultado.put("pedidos",jdbc.queryForObject("SELECT count(*) FROM pedido WHERE estado='PENDIENTE'",Map.of(),Long.class));
        if (reglas.administrador()) {
            resultado.put("personas",jdbc.queryForObject("SELECT count(*) FROM persona",Map.of(),Long.class));
            resultado.putAll(jdbc.queryForMap("SELECT count(*) AS usuarios, count(*) FILTER (WHERE estado) AS activos, count(*) FILTER (WHERE NOT estado) AS inactivos FROM usuario",Map.of()));
        }
        return resultado;
    }
}
