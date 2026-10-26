package com.florarte.backend.services;

import java.util.*;
import java.math.BigDecimal;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class ReporteService {
    private final NamedParameterJdbcTemplate jdbc;
    public ReporteService(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
    private static final String FECHA=" WHERE fecha>=:desde AND fecha<:hasta";
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> operativos(String periodo,String fecha){
        var rango=PeriodoReporte.de(periodo,fecha);var args=rango.parametros();var resultado=new LinkedHashMap<String,Object>();
        resultado.put("periodo",rango.descripcion());
        resultado.put("floresDemandadas",jdbc.queryForList("SELECT id_flor AS id,flor AS nombre,sum(cantidad) AS unidades FROM vw_reporte_demanda_flores"+FECHA+" GROUP BY id_flor,flor ORDER BY unidades DESC,id_flor LIMIT 5",args));
        for(String modulo:List.of("PEDIDOS","ARREGLOS","EVENTOS")) {
            var filtros=new HashMap<>(args);filtros.put("modulo",modulo);
            String orden=modulo.equals("ARREGLOS")?"unidades DESC,solicitudes DESC":"solicitudes DESC,unidades DESC";
            resultado.put("clientes"+modulo,jdbc.queryForList("SELECT id_cliente AS id,cliente AS nombre,count(*) AS solicitudes,sum(unidades) AS unidades FROM vw_reporte_clientes"+FECHA+" AND modulo=:modulo AND estado<>'CANCELADO' GROUP BY id_cliente,cliente ORDER BY "+orden+",id_cliente LIMIT 5",filtros));
        }
        resultado.put("arreglosSolicitados",jdbc.queryForList("SELECT id_arreglo AS id,arreglo AS nombre,count(*) AS solicitudes,sum(cantidad) AS unidades FROM vw_reporte_arreglos"+FECHA+" AND estado<>'CANCELADO' GROUP BY id_arreglo,arreglo ORDER BY unidades DESC,solicitudes DESC,id_arreglo LIMIT 5",args));
        resultado.put("floresCompradas",jdbc.queryForList("SELECT id_flor AS id,flor AS nombre,sum(cantidad) AS unidades,sum(subtotal) AS importe FROM vw_reporte_compras_flores"+FECHA+" GROUP BY id_flor,flor ORDER BY unidades DESC,id_flor LIMIT 5",args));
        resultado.put("proveedores",jdbc.queryForList("SELECT id_proveedor AS id,proveedor AS nombre,count(*) AS compras,sum(total) AS importe FROM vw_reporte_compras"+FECHA+" GROUP BY id_proveedor,proveedor ORDER BY importe DESC,compras DESC,id_proveedor LIMIT 5",args));
        resultado.put("gastosMensuales",jdbc.queryForList("SELECT to_char(fecha,'YYYY-MM') AS mes,count(*) AS compras,sum(total) AS importe FROM vw_reporte_compras"+FECHA+" GROUP BY to_char(fecha,'YYYY-MM') ORDER BY mes",args));
        resultado.put("gastos",jdbc.queryForMap("SELECT count(*) AS compras,coalesce(sum(total),0) AS importe FROM vw_reporte_compras"+FECHA,args));
        return resultado;
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> financieros(String periodo,String fecha){
        var rango=PeriodoReporte.de(periodo,fecha);var args=rango.parametros();var resultado=new LinkedHashMap<String,Object>();
        resultado.put("periodo",rango.descripcion());
        var ingresos=jdbc.queryForList("SELECT modulo,sum(operaciones) AS operaciones,coalesce(sum(importe),0) AS importe,sum(sin_importe) AS \"sinImporte\",sum(fechas_estimadas) AS \"fechasEstimadas\" FROM vw_reporte_ingresos_diarios"+FECHA+" GROUP BY modulo ORDER BY modulo",args);
        BigDecimal total=BigDecimal.ZERO;
        for(String modulo:List.of("PEDIDOS","ARREGLOS","EVENTOS")) {
            if(ingresos.stream().noneMatch(i->modulo.equals(i.get("modulo"))))ingresos.add(new LinkedHashMap<>(Map.of("modulo",modulo,"operaciones",0,"importe",BigDecimal.ZERO,"sinImporte",0,"fechasEstimadas",0)));
        }
        for(var i:ingresos)total=total.add((BigDecimal)i.get("importe"));
        resultado.put("ingresos",ingresos);resultado.put("totalIngresos",total);
        var gastos=jdbc.queryForMap("SELECT coalesce(sum(total),0) AS importe,count(*) AS compras FROM vw_reporte_compras"+FECHA,args);resultado.put("gastos",gastos);
        var perdidas=jdbc.queryForMap("SELECT coalesce(sum(importe),0) AS importe,coalesce(sum(unidades),0) AS unidades,coalesce(sum(sin_costo),0) AS \"sinCosto\" FROM vw_reporte_perdidas_diarias"+FECHA,args);resultado.put("perdidas",perdidas);
        resultado.put("balance",total.subtract((BigDecimal)gastos.get("importe")));
        resultado.put("floresDesechadas",jdbc.queryForList("SELECT id_flor AS id,flor AS nombre,sum(cantidad) AS unidades,coalesce(sum(perdida_costo_estimada),0) AS importe,count(*) FILTER (WHERE costo_referencia IS NULL) AS \"sinCosto\" FROM vw_reporte_mermas"+FECHA+" GROUP BY id_flor,flor ORDER BY unidades DESC,id_flor LIMIT 5",args));
        return resultado;
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> mermas(String periodo,String fecha,int pagina,int tamano){
        if(pagina<0||tamano<1||tamano>50)throw new IllegalArgumentException("Paginación inválida");var rango=PeriodoReporte.de(periodo,fecha);var args=new HashMap<>(rango.parametros());
        var resumen=jdbc.queryForMap("SELECT count(*) AS registros,coalesce(sum(cantidad),0) AS unidades,coalesce(sum(perdida_costo_estimada),0) AS importe,count(*) FILTER (WHERE costo_referencia IS NULL) AS \"sinCosto\" FROM vw_reporte_mermas"+FECHA,args);
        long total=((Number)resumen.get("registros")).longValue();int paginas=(int)((total+tamano-1)/tamano),actual=Math.min(pagina,Math.max(0,paginas-1));args.put("limite",tamano);args.put("offset",(long)actual*tamano);
        var contenido=jdbc.queryForList("SELECT id_merma AS id,fecha,id_flor AS \"idFlor\",flor AS nombre,cantidad,costo_referencia AS \"costoUnitario\",perdida_costo_estimada AS importe,costo_registrado AS \"costoRegistrado\" FROM vw_reporte_mermas"+FECHA+" ORDER BY fecha DESC,id_merma DESC LIMIT :limite OFFSET :offset",args);
        for(var fila:contenido)if(fila.get("fecha") instanceof java.sql.Timestamp f)fila.put("fecha",f.toLocalDateTime().toString());
        return Map.of("contenido",contenido,"resumen",resumen,"pagina",actual,"tamano",tamano,"totalElementos",total,"totalPaginas",paginas,"periodo",rango.descripcion());
    }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> exportacion(String periodo,String fecha){
        var rango=PeriodoReporte.de(periodo,fecha);var args=rango.parametros();
        long total=jdbc.queryForObject("SELECT count(*) FROM vw_reporte_mermas"+FECHA,args,Long.class);
        if(total>10000)throw new IllegalArgumentException("El período supera 10,000 mermas. Selecciona un período menor para exportar el detalle completo.");
        var filas=jdbc.queryForList("SELECT id_merma AS id,fecha,flor AS nombre,cantidad,costo_referencia AS \"costoUnitario\",perdida_costo_estimada AS importe,costo_registrado AS \"costoRegistrado\" FROM vw_reporte_mermas"+FECHA+" ORDER BY fecha,id_merma",args);
        for(var fila:filas)if(fila.get("fecha") instanceof java.sql.Timestamp f)fila.put("fecha",f.toLocalDateTime().toString());
        return Map.of("finanzas",financieros(periodo,fecha),"operativos",operativos(periodo,fecha),"mermas",filas);
    }
}
