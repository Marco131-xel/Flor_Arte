package com.florarte.backend.services;

import com.florarte.backend.dtos.EventoDTO;
import java.sql.Timestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventoService {
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;
    private final ReglasEdicion reglas;
    private static final Set<String> ESTADOS=Set.of("PENDIENTE","CONFIRMADO","TRABAJANDO","REALIZADO","PAGADO","CANCELADO");
    private static final Map<String,Set<String>> PASOS=Map.of(
        "PENDIENTE",Set.of("CONFIRMADO","CANCELADO"),"CONFIRMADO",Set.of("TRABAJANDO","CANCELADO"),
        "TRABAJANDO",Set.of("REALIZADO","CANCELADO"),"REALIZADO",Set.of("PAGADO"),
        "PAGADO",Set.of(),"CANCELADO",Set.of("PENDIENTE"));
    private static final String CAMPOS="e.id_evento AS \"idEvento\",e.nombre,e.id_cliente AS \"idCliente\",c.nombre AS \"nombreCliente\",e.id_empleado AS \"idEmpleado\",p.nombre AS \"nombreEmpleado\",e.fecha,e.dias_preparacion AS \"diasPreparacion\",e.fecha::date-e.dias_preparacion AS \"inicioPreparacion\",e.descripcion,e.ubicacion,e.importe,e.fecha_pago AS \"fechaPago\",e.estado,e.reserva_aplicada AS \"reservaAplicada\",e.creado_en AS \"creadoEn\",coalesce((SELECT sum(d.cantidad) FROM detalle_evento d WHERE d.id_evento=e.id_evento),0) AS \"totalFlores\"";
    private static final String TABLAS=" FROM evento e JOIN persona c ON c.id_persona=e.id_cliente LEFT JOIN persona p ON p.id_persona=e.id_empleado";
    public EventoService(JdbcTemplate jdbc,ReglasEdicion reglas){this.jdbc=jdbc;this.named=new NamedParameterJdbcTemplate(jdbc);this.reglas=reglas;}
    private Map<String,Object> uno(String sql,Object... args){var filas=jdbc.queryForList(sql,args);if(filas.isEmpty())throw new IllegalArgumentException("Evento o registro no encontrado");return filas.getFirst();}
    private void permiso(int id){if(!reglas.editar("eventos",id))throw new AccessDeniedException("El plazo de edición o eliminación terminó");}
    private int numero(Map<String,Object> fila,String clave){return ((Number)fila.get(clave)).intValue();}
    private boolean terminado(Map<String,Object> e){return Set.of("REALIZADO","PAGADO").contains(e.get("estado"));}
    private void fechas(Map<String,Object> e){
        if(e.get("fecha") instanceof Timestamp f)e.put("fecha",f.toLocalDateTime().toString());
        if(e.get("fechaPago") instanceof Timestamp f)e.put("fechaPago",f.toLocalDateTime().toString());
        if(e.get("inicioPreparacion")!=null)e.put("inicioPreparacion",e.get("inicioPreparacion").toString());
        if(e.get("creadoEn") instanceof Timestamp f){var creado=f.toInstant();e.put("creadoEn",creado.toString());e.put("editableHasta",creado.plusSeconds(1800).toString());e.put("puedeEditar",reglas.administrador()||reglas.dentroDePlazo(creado));}
        e.put("estadosPermitidos",PASOS.get(e.get("estado")));
    }
    private List<Map<String,Object>> flores(int id){return jdbc.queryForList("SELECT d.id_flor AS \"idFlor\",concat(t.nombre,' ',c.nombre) AS \"nombreFlor\",d.cantidad,f.stock AS \"stockDisponible\",f.estado AS disponible,t.imagen_url AS \"imagenUrl\" FROM detalle_evento d JOIN flor f ON f.id_flor=d.id_flor JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color WHERE d.id_evento=? ORDER BY d.id_flor",id);}
    public Map<String,Object> detalle(int id){var e=uno("SELECT "+CAMPOS+TABLAS+" WHERE e.id_evento=?",id);fechas(e);e.put("detalles",flores(id));return e;}
    private Map<Integer,Integer> cantidades(int id){var mapa=new TreeMap<Integer,Integer>();for(var d:flores(id))mapa.put(numero(d,"idFlor"),numero(d,"cantidad"));return mapa;}
    private void validarPersona(Long id,boolean cliente){
        if(id==null){if(cliente)throw new IllegalArgumentException("Selecciona un cliente");return;}
        var p=uno("SELECT r.tipo FROM persona p JOIN rol r ON r.id_rol=p.id_rol WHERE p.id_persona=?",id);
        if(cliente?!"CLIENTE".equals(p.get("tipo")):!Set.of("ADMINISTRADOR","EMPLEADO").contains(p.get("tipo")))throw new IllegalArgumentException("Cliente o responsable no válido");
    }
    private void stock(Map<Integer,Integer> cambios){
        var ids=cambios.keySet().stream().filter(id->cambios.get(id)!=0).sorted().toList();if(ids.isEmpty())return;
        var filas=named.queryForList("SELECT id_flor,stock,estado FROM flor WHERE id_flor IN (:ids) ORDER BY id_flor FOR UPDATE",Map.of("ids",ids));
        if(filas.size()!=ids.size())throw new IllegalArgumentException("Alguna flor no existe");
        for(var f:filas){int delta=cambios.get(numero(f,"id_flor"));long nuevo=(long)numero(f,"stock")+delta;if(nuevo<0||nuevo>Integer.MAX_VALUE||delta<0&&!Boolean.TRUE.equals(f.get("estado")))throw new IllegalArgumentException("No hay flores disponibles suficientes para reservar la flor #"+f.get("id_flor"));}
        for(var f:filas){int id=numero(f,"id_flor"),delta=cambios.get(id);jdbc.update("UPDATE flor SET stock=stock+? WHERE id_flor=?",delta,id);jdbc.update("INSERT INTO movimiento_inventario(id_flor,tipo_movimiento,cantidad,motivo) VALUES (?,?,?,'EVENTO')",id,delta<0?"SALIDA":"ENTRADA",Math.abs(delta));}
    }
    @Transactional public Map<String,Object> guardar(Integer id,EventoDTO dto){
        var original=id==null?null:uno("SELECT * FROM evento WHERE id_evento=? FOR UPDATE",id);if(id!=null)permiso(id);
        if(dto.nombre()==null||dto.nombre().isBlank()||dto.nombre().strip().length()>150||dto.fecha()==null||dto.fecha().getYear()<1900||dto.fecha().getYear()>9999||dto.diasPreparacion()==null||dto.diasPreparacion()<0||dto.diasPreparacion()>365||dto.detalles()==null||dto.detalles().isEmpty())throw new IllegalArgumentException("Revisa nombre, fecha, preparación y flores");
        validarImporte(dto.importe());
        if(original!=null&&"PAGADO".equals(original.get("estado"))&&dto.importe()==null)throw new IllegalArgumentException("Un evento pagado debe conservar su importe");
        validarPersona(dto.idCliente(),true);validarPersona(dto.idEmpleado(),false);
        var nuevas=new TreeMap<Integer,Integer>();
        for(var d:dto.detalles()){if(d==null||d.idFlor()==null||d.cantidad()==null||d.cantidad()<=0||nuevas.putIfAbsent(d.idFlor(),d.cantidad())!=null)throw new IllegalArgumentException("Agrega flores únicas con cantidades enteras positivas");}
        if(named.queryForObject("SELECT count(*) FROM flor WHERE id_flor IN (:ids)",Map.of("ids",nuevas.keySet()),Long.class)!=nuevas.size())throw new IllegalArgumentException("Alguna flor no existe");
        var anteriores=id==null?new TreeMap<Integer,Integer>():cantidades(id);
        if(original!=null&&terminado(original)&&!anteriores.equals(nuevas))throw new IllegalArgumentException("Las flores de un evento realizado o pagado ya fueron utilizadas; no se puede cambiar su composición");
        if(original!=null&&Boolean.TRUE.equals(original.get("reserva_aplicada"))){var cambios=new TreeMap<>(anteriores);nuevas.forEach((flor,cantidad)->cambios.merge(flor,-cantidad,Integer::sum));stock(cambios);}
        String descripcion=dto.descripcion()==null||dto.descripcion().isBlank()?null:dto.descripcion().strip(),ubicacion=dto.ubicacion()==null||dto.ubicacion().isBlank()?null:dto.ubicacion().strip();
        if(id==null)id=jdbc.queryForObject("INSERT INTO evento(nombre,id_cliente,id_empleado,fecha,dias_preparacion,descripcion,ubicacion,importe) VALUES (?,?,?,?,?,?,?,?) RETURNING id_evento",Integer.class,dto.nombre().strip(),dto.idCliente(),dto.idEmpleado(),dto.fecha(),dto.diasPreparacion(),descripcion,ubicacion,dto.importe());
        else jdbc.update("UPDATE evento SET nombre=?,id_cliente=?,id_empleado=?,fecha=?,dias_preparacion=?,descripcion=?,ubicacion=?,importe=? WHERE id_evento=?",dto.nombre().strip(),dto.idCliente(),dto.idEmpleado(),dto.fecha(),dto.diasPreparacion(),descripcion,ubicacion,dto.importe(),id);
        jdbc.update("DELETE FROM detalle_evento WHERE id_evento=?",id);for(var d:dto.detalles())jdbc.update("INSERT INTO detalle_evento(id_evento,id_flor,cantidad) VALUES (?,?,?)",id,d.idFlor(),d.cantidad());return detalle(id);
    }
    private void validarImporte(BigDecimal importe){
        if(importe!=null&&(importe.signum()<0||importe.compareTo(new BigDecimal("99999999.99"))>0||importe.stripTrailingZeros().scale()>2))throw new IllegalArgumentException("Importe inválido: máximo Q99,999,999.99 y dos decimales");
    }
    @Transactional public Map<String,Object> estado(int id,String siguiente){return estado(id,siguiente,null);}
    @Transactional public Map<String,Object> estado(int id,String siguiente,BigDecimal importe){
        var e=uno("SELECT * FROM evento WHERE id_evento=? FOR UPDATE",id);String actual=(String)e.get("estado");
        if(actual.equals(siguiente)){
            BigDecimal registrado=(BigDecimal)e.get("importe");
            if(importe!=null&&(registrado==null||registrado.compareTo(importe)!=0))throw new IllegalArgumentException("El estado ya está registrado; corrige el importe desde la edición del evento");
            return detalle(id);
        }
        if(!ESTADOS.contains(siguiente==null?"":siguiente)||!PASOS.get(actual).contains(siguiente))throw new IllegalArgumentException("No se puede pasar de "+actual+" a "+siguiente);
        if(siguiente.equals("TRABAJANDO")&&((Timestamp)e.get("fecha")).toLocalDateTime().toLocalDate().isAfter(reglas.ahora().atZone(ZoneId.of("America/Guatemala")).toLocalDate()))throw new IllegalArgumentException("Marca trabajando a partir del día del evento");
        if(importe!=null&&!"PAGADO".equals(siguiente))throw new IllegalArgumentException("El importe solo se registra al pagar; para otros cambios utiliza la edición del evento");
        BigDecimal acordado=(BigDecimal)e.get("importe");
        if("PAGADO".equals(siguiente)) {
            validarImporte(importe);
            if(acordado!=null&&importe!=null&&acordado.compareTo(importe)!=0)throw new IllegalArgumentException("El importe enviado no coincide con el acordado; corrígelo desde la edición del evento");
            if(acordado==null)acordado=importe;
            if(acordado==null)throw new IllegalArgumentException("Registra el importe del evento antes de marcarlo pagado");
        }
        boolean reservada=Boolean.TRUE.equals(e.get("reserva_aplicada")),nueva=!Set.of("PENDIENTE","CANCELADO").contains(siguiente);
        if(reservada!=nueva){var cambios=cantidades(id);if(nueva)cambios.replaceAll((flor,cantidad)->-cantidad);stock(cambios);}
        jdbc.update("UPDATE evento SET estado=?,reserva_aplicada=?,importe=?,fecha_pago=CASE WHEN ?='PAGADO' THEN ? ELSE fecha_pago END WHERE id_evento=?",siguiente,nueva,acordado,siguiente,Timestamp.valueOf(reglas.ahora().atZone(ZoneId.of("America/Guatemala")).toLocalDateTime()),id);return detalle(id);
    }
    @Transactional public void eliminar(int id){var e=uno("SELECT * FROM evento WHERE id_evento=? FOR UPDATE",id);permiso(id);if(terminado(e))throw new IllegalArgumentException("Un evento realizado o pagado se conserva en el historial");if(Boolean.TRUE.equals(e.get("reserva_aplicada")))stock(cantidades(id));jdbc.update("DELETE FROM evento WHERE id_evento=?",id);}
    private record Filtro(String sql,Map<String,Object> args){}
    private Filtro filtro(int anio,int mes,String dia,String estado,String q){
        if(anio<1900||anio>9999||mes<0||mes>12||q.length()>100||!estado.isEmpty()&&!ESTADOS.contains(estado))throw new IllegalArgumentException("Filtros no válidos");
        LocalDate desde,hasta;
        try{if(!dia.isBlank()){desde=LocalDate.parse(dia);if(desde.getYear()!=anio||mes!=0&&desde.getMonthValue()!=mes)throw new IllegalArgumentException("El día debe pertenecer al período seleccionado");hasta=desde.plusDays(1);}else{desde=LocalDate.of(anio,mes==0?1:mes,1);hasta=mes==0?desde.plusYears(1):desde.plusMonths(1);}}catch(DateTimeException ex){throw new IllegalArgumentException("Fecha no válida");}
        var args=new HashMap<String,Object>();args.put("desde",Timestamp.valueOf(desde.atStartOfDay()));args.put("hasta",Timestamp.valueOf(hasta.atStartOfDay()));
        String sql=" WHERE e.fecha>=:desde AND e.fecha<:hasta";
        if(!estado.isEmpty()){sql+=" AND e.estado=:estado";args.put("estado",estado);}
        if(!q.isBlank()){sql+=" AND lower(concat(e.nombre,' ',c.nombre,' ',e.ubicacion,' ',e.id_evento)) LIKE :q ESCAPE '!'";args.put("q","%"+q.strip().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%");}
        return new Filtro(sql,args);
    }
    public Map<String,Object> pagina(int anio,int mes,String dia,String estado,String q,int pagina,int tamano,boolean preparacion){
        if(pagina<0||tamano<1||tamano>50)throw new IllegalArgumentException("Paginación no válida");var f=filtro(anio,mes,dia,estado,q);
        if(preparacion)f=new Filtro(f.sql().replace("e.fecha>=:desde AND e.fecha<:hasta","(e.fecha::date-e.dias_preparacion)>=:desde AND (e.fecha::date-e.dias_preparacion)<:hasta")+" AND e.dias_preparacion>0 AND e.estado IN ('PENDIENTE','CONFIRMADO')",f.args());
        var resumen=named.queryForMap("SELECT count(*) AS eventos,count(*) FILTER (WHERE e.estado='PENDIENTE') AS pendientes,count(*) FILTER (WHERE e.estado IN ('CONFIRMADO','TRABAJANDO')) AS reservados,coalesce(sum((SELECT sum(d.cantidad) FROM detalle_evento d WHERE d.id_evento=e.id_evento)) FILTER (WHERE e.estado IN ('CONFIRMADO','TRABAJANDO')),0) AS \"floresReservadas\""+TABLAS+f.sql(),f.args());
        long total=((Number)resumen.get("eventos")).longValue();int paginas=(int)((total+tamano-1)/tamano),actual=Math.min(pagina,Math.max(0,paginas-1));f.args().put("limite",tamano);f.args().put("offset",(long)actual*tamano);
        var filas=named.queryForList("SELECT "+CAMPOS+TABLAS+f.sql()+" ORDER BY e.fecha,e.id_evento LIMIT :limite OFFSET :offset",f.args());filas.forEach(this::fechas);
        return Map.of("contenido",filas,"pagina",actual,"tamano",tamano,"totalElementos",total,"totalPaginas",paginas,"resumen",resumen,"horaServidor",reglas.ahora().toString());
    }
    public Map<String,Object> calendario(int anio,int mes,String estado,String q){
        if(mes<1||mes>12)throw new IllegalArgumentException("Selecciona un mes");var f=filtro(anio,mes,"",estado,q);
        var dias=named.queryForList("SELECT e.fecha::date AS dia,count(*) AS eventos,count(*) FILTER (WHERE e.estado='PENDIENTE') AS pendientes,count(*) FILTER (WHERE e.estado IN ('CONFIRMADO','TRABAJANDO')) AS reservados,count(*) FILTER (WHERE e.estado='CANCELADO') AS cancelados,coalesce(sum((SELECT sum(d.cantidad) FROM detalle_evento d WHERE d.id_evento=e.id_evento)) FILTER (WHERE e.estado IN ('CONFIRMADO','TRABAJANDO')),0) AS \"floresReservadas\""+TABLAS+f.sql()+" GROUP BY e.fecha::date ORDER BY e.fecha::date",f.args());
        dias.forEach(d->d.put("dia",d.get("dia").toString()));
        // La preparación también puede empezar el mes anterior al evento.
        var preparacion=named.queryForList("SELECT (e.fecha::date-e.dias_preparacion) AS dia,count(*) AS eventos"+TABLAS+f.sql().replace("e.fecha>=:desde AND e.fecha<:hasta","(e.fecha::date-e.dias_preparacion)>=:desde AND (e.fecha::date-e.dias_preparacion)<:hasta")+" AND e.dias_preparacion>0 AND e.estado IN ('PENDIENTE','CONFIRMADO') GROUP BY (e.fecha::date-e.dias_preparacion)",f.args());preparacion.forEach(d->d.put("dia",d.get("dia").toString()));
        return Map.of("dias",dias,"preparacion",preparacion,"anio",anio,"mes",mes);
    }
}
