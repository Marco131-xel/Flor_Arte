package com.florarte.backend.services;

import java.util.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class ComprobanteService {
    private final NamedParameterJdbcTemplate jdbc;
    public ComprobanteService(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
    private static final String CAMPOS="id_comprobante AS id,tipo,id_origen AS \"idOrigen\",documento::text AS documento,to_char(emitido_en AT TIME ZONE 'America/Guatemala','YYYY-MM-DD\"T\"HH24:MI:SS') AS \"emitidoEn\",emitido_por AS \"emitidoPor\"";
    private static final String EMPRESA="jsonb_build_object('nombre','FlorArte','direccion','1 Calle 25-78 Zona1, Quetzaltenango','correo','jadestrella7@gmail.com','telefono','+502 3584 7828')";
    private static String flor(){return "concat(t.nombre,' ',co.nombre)";}
    private String fuente(String tipo) {
        String lineas="jsonb_build_object('descripcion',"+flor()+",'cantidad',d.cantidad,'precio',d.precio,'subtotal',d.subtotal)";
        return switch(tipo){
            case "PEDIDO" -> "SELECT p.fecha,p.estado,p.total,c.nombre AS persona,NULL::text AS direccion,c.telefono,c.correo,e.nombre AS responsable,(SELECT coalesce(jsonb_agg("+lineas+" ORDER BY d.id_detalle_pedido),'[]'::jsonb) FROM detalle_pedido d JOIN flor f ON f.id_flor=d.id_flor JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color co ON co.id_color=f.id_color WHERE d.id_pedido=p.id_pedido) AS lineas FROM pedido p JOIN persona c ON c.id_persona=p.id_cliente LEFT JOIN persona e ON e.id_persona=p.id_empleado WHERE p.id_pedido=:origen";
            case "ARREGLO" -> "SELECT p.fecha,p.estado,p.total,c.nombre AS persona,NULL::text AS direccion,c.telefono,c.correo,e.nombre AS responsable,jsonb_build_array(jsonb_build_object('descripcion',p.nombre_arreglo,'cantidad',p.cantidad,'precio',p.precio_unitario,'subtotal',p.total)) AS lineas FROM pedido_arreglo p JOIN persona c ON c.id_persona=p.id_cliente LEFT JOIN persona e ON e.id_persona=p.id_empleado WHERE p.id_pedido_arreglo=:origen";
            case "EVENTO" -> "SELECT p.fecha,p.estado,p.importe AS total,c.nombre AS persona,NULL::text AS direccion,c.telefono,c.correo,e.nombre AS responsable,jsonb_build_array(jsonb_build_object('descripcion',p.nombre||coalesce(' · '||nullif(p.ubicacion,''),''),'cantidad',1,'precio',p.importe,'subtotal',p.importe)) AS lineas FROM evento p JOIN persona c ON c.id_persona=p.id_cliente LEFT JOIN persona e ON e.id_persona=p.id_empleado WHERE p.id_evento=:origen";
            case "INVENTARIO" -> "SELECT p.fecha,'REGISTRADO'::text AS estado,p.total,c.nombre AS persona,NULL::text AS direccion,c.telefono,c.correo,NULL::text AS responsable,(SELECT coalesce(jsonb_agg(jsonb_build_object('descripcion',"+flor()+",'cantidad',d.cantidad,'precio',d.precio_compra,'subtotal',d.subtotal) ORDER BY d.id_detalle_entrada),'[]'::jsonb) FROM detalle_entrada d JOIN flor f ON f.id_flor=d.id_flor JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color co ON co.id_color=f.id_color WHERE d.id_entrada=p.id_entrada) AS lineas FROM entrada_inventario p JOIN persona c ON c.id_persona=p.id_persona WHERE p.id_entrada=:origen";
            default -> throw new IllegalArgumentException("Tipo de comprobante inválido");
        };
    }
    @Transactional
    public Map<String,Object> emitir(String tipo,int origen) {
        if(origen<=0)throw new IllegalArgumentException("Selecciona una operación válida");
        String fuente=fuente(tipo);var args=new HashMap<String,Object>();args.put("tipo",tipo);args.put("origen",origen);
        var existentes=jdbc.queryForList("SELECT "+CAMPOS+" FROM comprobante WHERE tipo=:tipo AND id_origen=:origen",args);
        if(!existentes.isEmpty())return existentes.getFirst();
        args.put("usuario",SecurityContextHolder.getContext().getAuthentication().getName());
        String sql="INSERT INTO comprobante(tipo,id_origen,emitido_por,documento) SELECT :tipo,:origen,:usuario,jsonb_build_object('empresa',"+EMPRESA+",'persona',s.persona,'direccion',s.direccion,'telefono',s.telefono,'correo',s.correo,'responsable',s.responsable,'fecha',s.fecha,'estado',s.estado,'total',s.total,'lineas',s.lineas) FROM ("+fuente+") s WHERE s.total IS NOT NULL AND s.estado<>'CANCELADO' AND jsonb_array_length(s.lineas)>0 ON CONFLICT(tipo,id_origen) DO NOTHING RETURNING "+CAMPOS;
        var nuevo=jdbc.queryForList(sql,args);if(!nuevo.isEmpty())return nuevo.getFirst();
        existentes=jdbc.queryForList("SELECT "+CAMPOS+" FROM comprobante WHERE tipo=:tipo AND id_origen=:origen",args);
        if(!existentes.isEmpty())return existentes.getFirst();
        throw new IllegalArgumentException("No se puede emitir: verifica que la operación exista, no esté cancelada y tenga importe y detalle registrados.");
    }
    @Transactional(readOnly=true)
    public Map<String,Object> detalle(long id){var filas=jdbc.queryForList("SELECT "+CAMPOS+" FROM comprobante WHERE id_comprobante=:id",Map.of("id",id));if(filas.isEmpty())throw new IllegalArgumentException("Comprobante no encontrado");return filas.getFirst();}
    @Transactional(readOnly=true)
    public Map<String,Object> pagina(int pagina,int tamano,String tipo,String mes,String q){
        if(pagina<0||tamano<1||tamano>50||q.length()>100)throw new IllegalArgumentException("Paginación inválida");
        String where=" WHERE 1=1";var args=new HashMap<String,Object>();
        if(!tipo.isBlank()){fuente(tipo);where+=" AND tipo=:tipo";args.put("tipo",tipo);}
        if(!mes.isBlank()){var rango=PeriodoReporte.de("MES",mes+"-01");args.putAll(rango.parametros());where+=" AND emitido_en>=(:desde AT TIME ZONE 'America/Guatemala') AND emitido_en<(:hasta AT TIME ZONE 'America/Guatemala')";}
        if(!q.isBlank()){where+=" AND (lower(documento->>'persona') LIKE :q ESCAPE '!' OR id_comprobante::text=:numero OR id_origen::text=:numero)";args.put("numero",q.strip());args.put("q","%"+q.strip().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%");}
        long total=jdbc.queryForObject("SELECT count(*) FROM comprobante"+where,args,Long.class);int paginas=(int)((total+tamano-1)/tamano),actual=Math.min(pagina,Math.max(0,paginas-1));args.put("limite",tamano);args.put("offset",(long)actual*tamano);
        var filas=jdbc.queryForList("SELECT id_comprobante AS id,tipo,id_origen AS \"idOrigen\",documento->>'persona' AS persona,(documento->>'total')::numeric AS total,to_char(emitido_en AT TIME ZONE 'America/Guatemala','YYYY-MM-DD\"T\"HH24:MI:SS') AS \"emitidoEn\" FROM comprobante"+where+" ORDER BY emitido_en DESC,id_comprobante DESC LIMIT :limite OFFSET :offset",args);
        return Map.of("contenido",filas,"pagina",actual,"tamano",tamano,"totalElementos",total,"totalPaginas",paginas);
    }
}
