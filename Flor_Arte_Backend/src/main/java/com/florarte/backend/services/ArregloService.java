package com.florarte.backend.services;

import com.florarte.backend.dtos.ArregloDTO;
import com.florarte.backend.dtos.PedidoArregloDTO;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArregloService {
    public static final String CAPACIDAD_SQL = "coalesce((SELECT min(CASE WHEN f.estado THEN f.stock/d.cantidad ELSE 0 END) FROM detalle_arreglo d JOIN flor f ON f.id_flor=d.id_flor WHERE d.id_arreglo=a.id_arreglo),0)";
    private static final Set<String> ESTADOS=Set.of("PENDIENTE","CONFIRMADO","PREPARANDO","LISTO","ENTREGADO","CANCELADO");
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;
    private final ReglasEdicion reglas;
    public ArregloService(JdbcTemplate jdbc,ReglasEdicion reglas) { this.jdbc=jdbc;this.named=new NamedParameterJdbcTemplate(jdbc);this.reglas=reglas; }

    private Map<String,Object> uno(String sql,Object... params) {
        var filas=jdbc.queryForList(sql,params);
        if(filas.isEmpty())throw new IllegalArgumentException("Registro no encontrado");
        return filas.getFirst();
    }
    private int numero(Map<String,Object> fila,String campo) { return ((Number)fila.get(campo)).intValue(); }
    private void permiso(String tipo,int id) {
        if(!reglas.editar(tipo,id))throw new AccessDeniedException("El plazo de edición o eliminación terminó");
    }
    private List<Map<String,Object>> composicion(String tabla,String clave,int id) {
        return jdbc.queryForList("SELECT d.id_flor AS \"idFlor\",concat(t.nombre,' ',c.nombre) AS \"nombreFlor\",d.cantidad FROM "+tabla+" d JOIN flor f ON f.id_flor=d.id_flor JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color WHERE d."+clave+"=? ORDER BY d.id_flor",id);
    }
    public Map<String,Object> arreglo(int id) {
        var resultado=uno("SELECT a.id_arreglo AS \"idArreglo\",a.nombre,a.descripcion,a.imagen_url AS \"imagenUrl\",a.precio,"+CAPACIDAD_SQL+" AS disponibles FROM arreglo a WHERE a.id_arreglo=?",id);
        resultado.put("detalles",composicion("detalle_arreglo","id_arreglo",id));return resultado;
    }
    public Map<String,Object> pedido(int id) {
        var resultado=uno("SELECT p.id_pedido_arreglo AS \"idPedidoArreglo\",p.id_cliente AS \"idCliente\",c.nombre AS \"nombreCliente\",p.id_empleado AS \"idEmpleado\",e.nombre AS \"nombreEmpleado\",p.id_arreglo AS \"idArreglo\",p.nombre_arreglo AS \"nombreArreglo\",p.cantidad,p.precio_unitario AS \"precioUnitario\",p.total,p.fecha,p.estado,a.imagen_url AS \"imagenUrl\" FROM pedido_arreglo p JOIN arreglo a ON a.id_arreglo=p.id_arreglo JOIN persona c ON c.id_persona=p.id_cliente LEFT JOIN persona e ON e.id_persona=p.id_empleado WHERE p.id_pedido_arreglo=?",id);
        if(resultado.get("fecha") instanceof Timestamp fecha)resultado.put("fecha",fecha.toLocalDateTime().toString());
        int unidades=numero(resultado,"cantidad");
        var detalles=composicion("detalle_pedido_arreglo","id_pedido_arreglo",id);
        for(var d:detalles) {int porUnidad=numero(d,"cantidad");d.put("cantidadPorArreglo",porUnidad);d.put("cantidad",multiplicar(porUnidad,unidades));}
        resultado.put("detalles",detalles);return resultado;
    }
    @Transactional
    public Map<String,Object> guardarArreglo(Integer id,ArregloDTO dto) {
        if(id!=null) {uno("SELECT id_arreglo FROM arreglo WHERE id_arreglo=? FOR UPDATE",id);permiso("arreglos",id);}
        if(dto.nombre()==null||dto.nombre().isBlank()||dto.nombre().strip().length()>100||dto.precio()==null||dto.precio().signum()<0||dto.detalles()==null||dto.detalles().isEmpty())throw new IllegalArgumentException("Revisa nombre, precio y composición");
        validarImporte(dto.precio());
        var flores=new HashSet<Integer>();
        for(var d:dto.detalles()) {
            if(d==null||d.idFlor()==null||d.cantidad()==null||d.cantidad()<=0||!flores.add(d.idFlor()))throw new IllegalArgumentException("La composición debe tener flores únicas y cantidades enteras positivas");
        }
        long existentes=named.queryForObject("SELECT count(*) FROM flor WHERE id_flor IN (:ids)",Map.of("ids",flores),Long.class);
        if(existentes!=flores.size())throw new IllegalArgumentException("Alguna flor no existe");
        if(jdbc.queryForObject("SELECT count(*) FROM arreglo WHERE nombre=? AND id_arreglo<>?",Long.class,dto.nombre().strip(),id==null?0:id)>0)throw new IllegalArgumentException("Ya existe un arreglo con ese nombre");
        String descripcion=dto.descripcion()==null||dto.descripcion().isBlank()?null:dto.descripcion().strip();
        String imagen=dto.imagenUrl()==null||dto.imagenUrl().isBlank()?null:dto.imagenUrl().strip();
        if(imagen!=null) {
            try {
                var uri=new java.net.URI(imagen);
                if(imagen.length()>2048||uri.getHost()==null||!("http".equalsIgnoreCase(uri.getScheme())||"https".equalsIgnoreCase(uri.getScheme())))throw new IllegalArgumentException();
            }catch(java.net.URISyntaxException|IllegalArgumentException ex){throw new IllegalArgumentException("La imagen debe ser una URL válida HTTP o HTTPS de hasta 2048 caracteres");}
        }
        if(id==null)id=jdbc.queryForObject("INSERT INTO arreglo(nombre,descripcion,precio,imagen_url) VALUES (?,?,?,?) RETURNING id_arreglo",Integer.class,dto.nombre().strip(),descripcion,dto.precio(),imagen);
        else jdbc.update("UPDATE arreglo SET nombre=?,descripcion=?,precio=?,imagen_url=? WHERE id_arreglo=?",dto.nombre().strip(),descripcion,dto.precio(),imagen,id);
        jdbc.update("DELETE FROM detalle_arreglo WHERE id_arreglo=?",id);
        for(var d:dto.detalles())jdbc.update("INSERT INTO detalle_arreglo(id_arreglo,id_flor,cantidad) VALUES (?,?,?)",id,d.idFlor(),d.cantidad());
        return arreglo(id);
    }
    @Transactional
    public void eliminarArreglo(int id) {
        uno("SELECT id_arreglo FROM arreglo WHERE id_arreglo=? FOR UPDATE",id);permiso("arreglos",id);
        if(jdbc.queryForObject("SELECT count(*) FROM pedido_arreglo WHERE id_arreglo=?",Long.class,id)>0)throw new IllegalArgumentException("El arreglo tiene pedidos registrados y no se puede eliminar");
        jdbc.update("DELETE FROM arreglo WHERE id_arreglo=?",id);
    }
    private void persona(Long id,boolean cliente) {
        if(id==null) {if(cliente)throw new IllegalArgumentException("Selecciona un cliente");return;}
        var p=uno("SELECT r.tipo FROM persona p JOIN rol r ON r.id_rol=p.id_rol WHERE p.id_persona=?",id);
        if(cliente?!"CLIENTE".equals(p.get("tipo")):!Set.of("EMPLEADO","ADMINISTRADOR").contains(p.get("tipo")))throw new IllegalArgumentException(cliente?"La persona seleccionada no es cliente":"Responsable no válido");
    }
    private int multiplicar(int cantidad,int unidades) {
        try {return Math.multiplyExact(cantidad,unidades);}catch(ArithmeticException ex){throw new IllegalArgumentException("La cantidad supera el límite permitido");}
    }
    private Map<Integer,Integer> cantidades(List<Map<String,Object>> receta,int unidades) {
        var resultado=new TreeMap<Integer,Integer>();
        for(var d:receta)resultado.put(numero(d,"idFlor"),multiplicar(numero(d,"cantidad"),unidades));
        return resultado;
    }
    private void validarImporte(BigDecimal valor) {
        if(valor.signum()<0||valor.compareTo(new BigDecimal("99999999.99"))>0||valor.stripTrailingZeros().scale()>2)throw new IllegalArgumentException("Importe fuera de rango: máximo Q99,999,999.99 y dos decimales");
    }
    // Todas las flores se bloquean por ID antes de validar y escribir, evitando ventas simultáneas sin stock.
    private void ajustarStock(Map<Integer,Integer> cambios) {
        var ids=cambios.entrySet().stream().filter(e->e.getValue()!=0).map(Map.Entry::getKey).sorted().toList();
        if(ids.isEmpty())return;
        var filas=named.queryForList("SELECT f.id_flor,f.stock,f.estado,concat(t.nombre,' ',c.nombre) AS nombre FROM flor f JOIN tipo_flor t ON t.id_tipo_flor=f.id_tipo_flor JOIN color c ON c.id_color=f.id_color WHERE f.id_flor IN (:ids) ORDER BY f.id_flor FOR UPDATE OF f",Map.of("ids",ids));
        if(filas.size()!=ids.size())throw new IllegalArgumentException("Alguna flor no existe");
        for(var flor:filas) {
            int delta=cambios.get(numero(flor,"id_flor"));long stock=(long)numero(flor,"stock")+delta;
            if(stock<0||stock>Integer.MAX_VALUE)throw new IllegalArgumentException("Stock insuficiente o cantidad fuera de rango para "+flor.get("nombre"));
            if(delta<0&&!Boolean.TRUE.equals(flor.get("estado")))throw new IllegalArgumentException("Flor no disponible: "+flor.get("nombre"));
        }
        for(var flor:filas) {
            int id=numero(flor,"id_flor"),delta=cambios.get(id);
            jdbc.update("UPDATE flor SET stock=stock+? WHERE id_flor=?",delta,id);
            jdbc.update("INSERT INTO movimiento_inventario(id_flor,tipo_movimiento,cantidad,motivo) VALUES (?,?,?,'ARREGLO')",id,delta<0?"SALIDA":"ENTRADA",Math.abs(delta));
        }
    }
    @Transactional
    public Map<String,Object> guardarPedido(Integer id,PedidoArregloDTO dto) {
        var original=id==null?null:uno("SELECT * FROM pedido_arreglo WHERE id_pedido_arreglo=? FOR UPDATE",id);
        if(id!=null)permiso("pedidosArreglos",id);
        if(dto.idArreglo()==null||dto.cantidad()==null||dto.cantidad()<=0)throw new IllegalArgumentException("Selecciona un arreglo y una cantidad positiva");
        persona(dto.idCliente(),true);persona(dto.idEmpleado(),false);
        boolean mismo=original!=null&&numero(original,"id_arreglo")==dto.idArreglo();
        Map<String,Object> catalogo=mismo?null:uno("SELECT nombre,precio FROM arreglo WHERE id_arreglo=? FOR SHARE",dto.idArreglo());
        var anteriores=original==null?List.<Map<String,Object>>of():composicion("detalle_pedido_arreglo","id_pedido_arreglo",id);
        var receta=mismo?anteriores:composicion("detalle_arreglo","id_arreglo",dto.idArreglo());
        if(receta.isEmpty())throw new IllegalArgumentException("El arreglo no tiene flores definidas");
        BigDecimal precio=(BigDecimal)(mismo?original.get("precio_unitario"):catalogo.get("precio"));
        BigDecimal total=precio.multiply(BigDecimal.valueOf(dto.cantidad()));validarImporte(total);
        String nombre=(String)(mismo?original.get("nombre_arreglo"):catalogo.get("nombre"));
        boolean cancelado=original!=null&&"CANCELADO".equals(original.get("estado"));
        var cambios=new TreeMap<Integer,Integer>();
        if(original!=null&&!cancelado)cambios.putAll(cantidades(anteriores,numero(original,"cantidad")));
        if(!cancelado)cantidades(receta,dto.cantidad()).forEach((flor,cantidad)->cambios.merge(flor,-cantidad,Math::addExact));
        ajustarStock(cambios);
        if(id==null)id=jdbc.queryForObject("INSERT INTO pedido_arreglo(id_cliente,id_empleado,id_arreglo,nombre_arreglo,cantidad,precio_unitario,total) VALUES (?,?,?,?,?,?,?) RETURNING id_pedido_arreglo",Integer.class,dto.idCliente(),dto.idEmpleado(),dto.idArreglo(),nombre,dto.cantidad(),precio,total);
        else jdbc.update("UPDATE pedido_arreglo SET id_cliente=?,id_empleado=?,id_arreglo=?,nombre_arreglo=?,cantidad=?,precio_unitario=?,total=? WHERE id_pedido_arreglo=?",dto.idCliente(),dto.idEmpleado(),dto.idArreglo(),nombre,dto.cantidad(),precio,total,id);
        jdbc.update("DELETE FROM detalle_pedido_arreglo WHERE id_pedido_arreglo=?",id);
        for(var d:receta)jdbc.update("INSERT INTO detalle_pedido_arreglo(id_pedido_arreglo,id_flor,cantidad) VALUES (?,?,?)",id,numero(d,"idFlor"),numero(d,"cantidad"));
        return pedido(id);
    }
    @Transactional
    public Map<String,Object> estado(int id,String estado) {
        if(!ESTADOS.contains(estado==null?"":estado))throw new IllegalArgumentException("Estado no válido");
        var p=uno("SELECT * FROM pedido_arreglo WHERE id_pedido_arreglo=? FOR UPDATE",id);
        boolean antes="CANCELADO".equals(p.get("estado")),despues="CANCELADO".equals(estado);
        if(antes!=despues) {
            var cambios=cantidades(composicion("detalle_pedido_arreglo","id_pedido_arreglo",id),numero(p,"cantidad"));
            if(antes)cambios.replaceAll((flor,cantidad)->-cantidad);
            ajustarStock(cambios);
        }
        jdbc.update("UPDATE pedido_arreglo SET estado=? WHERE id_pedido_arreglo=?",estado,id);return pedido(id);
    }
    @Transactional
    public void eliminarPedido(int id) {
        var p=uno("SELECT * FROM pedido_arreglo WHERE id_pedido_arreglo=? FOR UPDATE",id);permiso("pedidosArreglos",id);
        if(!"CANCELADO".equals(p.get("estado")))ajustarStock(cantidades(composicion("detalle_pedido_arreglo","id_pedido_arreglo",id),numero(p,"cantidad")));
        jdbc.update("DELETE FROM pedido_arreglo WHERE id_pedido_arreglo=?",id);
    }
}
