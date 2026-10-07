package com.florarte.backend.services;

import com.florarte.backend.controllers.*;
import com.florarte.backend.dtos.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import jakarta.validation.Validation;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import static org.junit.jupiter.api.Assertions.*;

/** PostgreSQL desechable: nunca acepta una URL de la base de producción. */
class ReporteTest {
    static DriverManagerDataSource ds;
    JdbcTemplate jdbc; AnnotationConfigApplicationContext ctx; ReporteService service;
    long cliente,empleado; int flor,otra;
    @Configuration @EnableTransactionManagement @EnableMethodSecurity static class Config {}
    @BeforeAll static void conexion() {
        String url=System.getProperty("florarte.test.db");
        Assumptions.assumeTrue(url!=null&&url.matches("jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/florarte_test"));
        ds=new DriverManagerDataSource(url,"florarte_test","");
    }
    @BeforeEach void preparar() {
        jdbc=new JdbcTemplate(ds);jdbc.execute("DROP SCHEMA public CASCADE");jdbc.execute("CREATE SCHEMA public");
        var files=new java.io.File("src/main/resources/db/migration").listFiles((dir,name)->name.endsWith(".sql"));
        Arrays.sort(files,Comparator.comparingInt(f->Integer.parseInt(f.getName().substring(1,f.getName().indexOf("__")))));
        for(var file:files)new ResourceDatabasePopulator(new FileSystemResource(file)).execute(ds);
        cliente=jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES ('Cliente Arreglo',3) RETURNING id_persona",Long.class);
        empleado=jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES ('Empleado Arreglo',2) RETURNING id_persona",Long.class);
        flor=jdbc.queryForObject("INSERT INTO flor(id_tipo_flor,id_color,precio,stock) VALUES (1,1,10,100) RETURNING id_flor",Integer.class);
        otra=jdbc.queryForObject("INSERT INTO flor(id_tipo_flor,id_color,precio,stock) VALUES (2,1,5,10) RETURNING id_flor",Integer.class);
        ctx=new AnnotationConfigApplicationContext();ctx.register(Config.class);
        ctx.registerBean(JdbcTemplate.class,()->jdbc);
        ctx.registerBean("transactionManager",DataSourceTransactionManager.class,()->new DataSourceTransactionManager(ds));
        ctx.registerBean("reglasEdicion",ReglasEdicion.class,()->new ReglasEdicion(jdbc));
        ctx.registerBean(NamedParameterJdbcTemplate.class,()->new NamedParameterJdbcTemplate(ds));ctx.registerBean(ReporteService.class);ctx.registerBean(ReporteController.class);ctx.registerBean(ComprobanteService.class);ctx.registerBean(ComprobanteController.class);ctx.refresh();
        service=ctx.getBean(ReporteService.class);rol("ADMINISTRADOR");
    }
    @AfterEach void cerrar(){SecurityContextHolder.clearContext();ctx.close();}
    void rol(String rol){SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("test","test","ROLE_"+rol));}
    int pedido(String estado,long persona,String fecha,int cantidad){
        int id=jdbc.queryForObject("INSERT INTO pedido(id_cliente,fecha,estado,total) VALUES (?,?,?,100) RETURNING id_pedido",Integer.class,persona,java.sql.Timestamp.valueOf(fecha),estado);
        jdbc.update("INSERT INTO detalle_pedido(id_pedido,id_flor,cantidad,precio,subtotal) VALUES (?,?,?,10,50),(?,?,10,5,50)",id,flor,cantidad,id,otra);return id;
    }
    int arreglo(String estado,long persona,int cantidad,String fecha){
        int a=jdbc.queryForObject("INSERT INTO arreglo(nombre,precio) VALUES ('Ramo '||cast(? as text),25) RETURNING id_arreglo",Integer.class,java.util.UUID.randomUUID().toString());
        int id=jdbc.queryForObject("INSERT INTO pedido_arreglo(id_cliente,id_arreglo,nombre_arreglo,cantidad,precio_unitario,total,estado,fecha) VALUES (?,?,'Ramo',?,25,?, ?,?) RETURNING id_pedido_arreglo",Integer.class,persona,a,cantidad,cantidad*25,estado,java.sql.Timestamp.valueOf(fecha));
        jdbc.update("INSERT INTO detalle_pedido_arreglo(id_pedido_arreglo,id_flor,cantidad) VALUES (?,?,3),(?,?,2)",id,flor,id,otra);return id;
    }
    int evento(String estado,Long persona,java.math.BigDecimal importe,String fecha,String pago){
        int id=jdbc.queryForObject("INSERT INTO evento(nombre,id_cliente,fecha,estado,reserva_aplicada,importe,fecha_pago) VALUES ('Evento',?,?,?, ?,?,?) RETURNING id_evento",Integer.class,persona,java.sql.Timestamp.valueOf(fecha),estado,!Set.of("PENDIENTE","CANCELADO").contains(estado),importe,pago==null?null:java.sql.Timestamp.valueOf(pago));
        jdbc.update("INSERT INTO detalle_evento(id_evento,id_flor,cantidad) VALUES (?,?,7)",id,flor);return id;
    }
    long proveedor(String nombre){return jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES (?,4) RETURNING id_persona",Long.class,nombre);}
    int compra(long proveedor,String fecha,int idFlor,int cantidad,int precio){int id=jdbc.queryForObject("INSERT INTO entrada_inventario(id_persona,fecha,total) VALUES (?,?,?) RETURNING id_entrada",Integer.class,proveedor,java.sql.Timestamp.valueOf(fecha),cantidad*precio);jdbc.update("INSERT INTO detalle_entrada(id_entrada,id_flor,cantidad,precio_compra,subtotal) VALUES (?,?,?,?,?)",id,idFlor,cantidad,precio,cantidad*precio);return id;}
    void merma(int flor,int cantidad,String fecha){jdbc.update("INSERT INTO movimiento_inventario(id_flor,tipo_movimiento,motivo,cantidad,fecha) VALUES (?,'SALIDA','MERMA',?,?)",flor,cantidad,java.sql.Timestamp.valueOf(fecha));}
    java.math.BigDecimal dinero(String n){return new java.math.BigDecimal(n);}
    Map<?,?> financiero(){return service.financieros("MES","2030-10-08");}
    List<?> lista(Map<String,Object> r,String clave){return (List<?>)r.get(clave);}
    @Test void ingresosNoSeMultiplicanPorDetallesYCuentanSoloFinalizados(){
        pedido("ENTREGADO",cliente,"2030-10-08 10:00:00",5);pedido("CANCELADO",cliente,"2030-10-08 11:00:00",100);pedido("PENDIENTE",cliente,"2030-10-08 12:00:00",100);
        arreglo("ENTREGADO",cliente,2,"2030-10-08 10:00:00");arreglo("CONFIRMADO",cliente,10,"2030-10-08 10:00:00");
        evento("PAGADO",cliente,dinero("300"),"2030-09-10 10:00:00","2030-10-08 10:00:00");evento("REALIZADO",cliente,dinero("500"),"2030-10-08 10:00:00",null);
        assertEquals(dinero("450.00"),financiero().get("totalIngresos"));
        assertEquals(dinero("0"),service.financieros("MES","2030-09-08").get("totalIngresos"));
    }
    @Test void demandaCuentaFloresDeArreglosPorNumeroDeUnidades(){
        pedido("ENTREGADO",cliente,"2030-10-08 10:00:00",5);arreglo("ENTREGADO",cliente,2,"2030-10-08 10:00:00");evento("REALIZADO",cliente,dinero("300"),"2030-10-08 10:00:00",null);pedido("CANCELADO",cliente,"2030-10-08 10:00:00",200);
        var filas=lista(service.operativos("MES","2030-10-08"),"floresDemandadas");assertEquals(18,((Number)((Map<?,?>)filas.get(0)).get("unidades")).intValue());assertEquals(14,((Number)((Map<?,?>)filas.get(1)).get("unidades")).intValue());
    }
    @Test void mermaCostoPonderadoNoUsaComprasFuturasYSinCostoEsNull(){
        long p=proveedor("Proveedor");compra(p,"2030-10-01 10:00:00",flor,10,4);compra(p,"2030-10-02 10:00:00",flor,10,6);compra(p,"2031-10-01 10:00:00",flor,10,100);
        merma(flor,2,"2030-10-08 10:00:00");merma(otra,3,"2030-10-08 11:00:00");
        var r=service.mermas("MES","2030-10-08",0,10);var filas=(List<?>)r.get("contenido");assertNull(((Map<?,?>)filas.get(0)).get("importe"));assertEquals(dinero("10.00"),((Map<?,?>)filas.get(1)).get("importe"));assertEquals(1L,((Map<?,?>)r.get("resumen")).get("sinCosto"));
    }
    @Test void topCincoSeCalculaDespuesDelFiltroYEmpatesSonEstables(){
        for(int i=0;i<7;i++){long c=jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES (?,3) RETURNING id_persona",Long.class,"Cliente "+i);for(int j=0;j<=i;j++)pedido("PENDIENTE",c,"2030-10-08 10:00:00",1);}
        for(int i=0;i<40;i++)pedido("PENDIENTE",cliente,"2030-09-08 10:00:00",1);
        var top=lista(service.operativos("MES","2030-10-08"),"clientesPEDIDOS");assertEquals(5,top.size());assertEquals("Cliente 6",((Map<?,?>)top.getFirst()).get("nombre"));assertEquals(7L,((Map<?,?>)top.getFirst()).get("solicitudes"));
    }
    @Test void clienteConMasArreglosSeOrdenaPorUnidadesYNoPedidos(){
        long c=jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES ('Más arreglos',3) RETURNING id_persona",Long.class);arreglo("PENDIENTE",c,10,"2030-10-08 10:00:00");arreglo("PENDIENTE",cliente,1,"2030-10-08 10:00:00");arreglo("PENDIENTE",cliente,1,"2030-10-08 10:00:00");
        var top=lista(service.operativos("MES","2030-10-08"),"clientesARREGLOS");assertEquals("Más arreglos",((Map<?,?>)top.getFirst()).get("nombre"));assertEquals(10,((Number)((Map<?,?>)top.getFirst()).get("unidades")).intValue());
    }
    @Test void comprasNoSeDuplicanYMesDiaSemanaAnioSonExactos(){
        long p=proveedor("Proveedor");int entrada=compra(p,"2030-10-08 10:00:00",flor,10,4);jdbc.update("INSERT INTO detalle_entrada(id_entrada,id_flor,cantidad,precio_compra,subtotal) VALUES (?,?,20,3,60)",entrada,otra);jdbc.update("UPDATE entrada_inventario SET total=100 WHERE id_entrada=?",entrada);compra(p,"2030-09-08 10:00:00",flor,5,4);
        assertEquals(dinero("100.00"),((Map<?,?>)service.operativos("MES","2030-10-08").get("gastos")).get("importe"));assertEquals(dinero("120.00"),((Map<?,?>)service.operativos("ANIO","2030-10-08").get("gastos")).get("importe"));assertEquals(dinero("100.00"),((Map<?,?>)service.operativos("DIA","2030-10-08").get("gastos")).get("importe"));assertEquals(dinero("100.00"),((Map<?,?>)service.operativos("SEMANA","2030-10-08").get("gastos")).get("importe"));
    }
    @Test void proveedoresSeOrdenanPorImporteYTopComprasPorUnidades(){
        long a=proveedor("Proveedor A"),b=proveedor("Proveedor B");compra(a,"2030-10-01 10:00:00",flor,10,4);compra(b,"2030-10-01 10:00:00",otra,20,6);
        var r=service.operativos("MES","2030-10-08");assertEquals("Proveedor B",((Map<?,?>)lista(r,"proveedores").getFirst()).get("nombre"));assertEquals(otra,((Number)((Map<?,?>)lista(r,"floresCompradas").getFirst()).get("id")).intValue());
    }
    @Test void eventosSinImporteNiFechaSeReportanComoIncompletos(){
        evento("PAGADO",cliente,null,"2030-10-08 10:00:00",null);var ingresos=(List<?>)financiero().get("ingresos");var e=(Map<?,?>)ingresos.stream().filter(x->"EVENTOS".equals(((Map<?,?>)x).get("modulo"))).findFirst().orElseThrow();assertEquals(1,((Number)e.get("sinImporte")).intValue());assertEquals(1,((Number)e.get("fechasEstimadas")).intValue());
    }
    @Test void balanceNoRestaLaMermaOtraVez(){pedido("ENTREGADO",cliente,"2030-10-08 10:00:00",5);compra(proveedor("Proveedor"),"2030-10-01 10:00:00",flor,10,4);merma(flor,2,"2030-10-08 10:00:00");assertEquals(dinero("60.00"),financiero().get("balance"));assertEquals(dinero("8.00"),((Map<?,?>)financiero().get("perdidas")).get("importe"));}
    @Test void mermaSePaginaSinPerderTotales(){for(int i=0;i<25;i++)merma(flor,2,"2030-10-08 10:00:00");var r=service.mermas("MES","2030-10-08",0,10);assertEquals(25L,r.get("totalElementos"));assertEquals(10,((List<?>)r.get("contenido")).size());assertEquals(50,((Number)((Map<?,?>)r.get("resumen")).get("unidades")).intValue());assertEquals(2,service.mermas("MES","2030-10-08",99,10).get("pagina"));}
    @Test void reportesSonSoloConsultaYRestringidosPorRol(){var endpoint=ctx.getBean(ReporteController.class);rol("EMPLEADO");assertThrows(AccessDeniedException.class,()->endpoint.operativos("MES","2030-10-08"));assertThrows(AccessDeniedException.class,()->endpoint.financieros("MES","2030-10-08"));assertThrows(AccessDeniedException.class,()->endpoint.mermas("MES","2030-10-08",0,10));rol("ADMINISTRADOR");endpoint.financieros("MES","2030-10-08");rol("CLIENTE");assertThrows(AccessDeniedException.class,()->endpoint.operativos("MES","2030-10-08"));assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM evento",Integer.class));}
    @Test void semanaCruzaAnioYFebreroBisiestoUsaLimiteExclusivo(){var semana=PeriodoReporte.de("SEMANA","2030-01-01");assertEquals(LocalDate.of(2029,12,31),semana.desde());assertEquals(LocalDate.of(2030,1,7),semana.hasta());assertEquals(LocalDate.of(2032,3,1),PeriodoReporte.de("MES","2032-02-29").hasta());assertThrows(IllegalArgumentException.class,()->PeriodoReporte.de("MES","2030-02-30"));assertThrows(IllegalArgumentException.class,()->PeriodoReporte.de("TODOS","2030-10-08"));}

    @Test void costoGuardadoNoCambiaAlModificarComprasYListaLaPerdida() {
        compra(proveedor("Proveedor"),"2030-10-01 10:00:00",flor,10,4);
        merma(flor,3,"2030-10-08 10:00:00");jdbc.update("UPDATE movimiento_inventario SET costo_unitario=4.25 WHERE motivo='MERMA'");
        jdbc.update("UPDATE detalle_entrada SET precio_compra=99,subtotal=cantidad*99");
        var filas=(List<?>)service.mermas("MES","2030-10-08",0,10).get("contenido");assertEquals(dinero("12.75"),((Map<?,?>)filas.get(0)).get("importe"));
    }

    @Test void comprobanteConservaDocumentoYNoDuplicaEmisiones() {
        int id=pedido("PENDIENTE",cliente,"2030-10-08 10:00:00",5);var c=ctx.getBean(ComprobanteController.class);
        var recibo=c.emitir(new ComprobanteController.Emitir("PEDIDO",id));long numero=((Number)recibo.get("id")).longValue();String documento=(String)recibo.get("documento");
        assertTrue(documento.contains("FlorArte"));assertTrue(documento.contains("1 Calle 25-78 Zona1, Quetzaltenango"));assertTrue(documento.contains("jadestrella7@gmail.com"));assertTrue(documento.contains("PENDIENTE"));
        jdbc.update("UPDATE persona SET nombre='Cliente modificado' WHERE id_persona=?",cliente);jdbc.update("UPDATE pedido SET total=999 WHERE id_pedido=?",id);
        assertEquals(documento,c.detalle(numero).get("documento"));assertEquals(numero,((Number)c.emitir(new ComprobanteController.Emitir("PEDIDO",id)).get("id")).longValue());
        jdbc.update("DELETE FROM detalle_pedido WHERE id_pedido=?",id);jdbc.update("DELETE FROM pedido WHERE id_pedido=?",id);assertEquals(documento,c.detalle(numero).get("documento"));assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM comprobante",Integer.class));
    }
    @Test void comprobantesDeArregloEventoYCompraUsanImportesDeSuOperacion() {
        var c=ctx.getBean(ComprobanteController.class);int a=arreglo("ENTREGADO",cliente,3,"2030-10-08 10:00:00"),e=evento("PAGADO",cliente,dinero("150.00"),"2030-10-09 10:00:00","2030-10-08 10:00:00"),i=compra(proveedor("Proveedor"),"2030-10-08 10:00:00",flor,10,4);
        for(var par:List.of(new Object[]{"ARREGLO",a,75},new Object[]{"EVENTO",e,150},new Object[]{"INVENTARIO",i,40})){
            var r=c.emitir(new ComprobanteController.Emitir((String)par[0],(int)par[1]));assertEquals(par[2],jdbc.queryForObject("SELECT (documento->>'total')::numeric FROM comprobante WHERE id_comprobante=?",Integer.class,r.get("id")));
        }
        assertEquals(1,jdbc.queryForObject("SELECT jsonb_array_length(documento->'lineas') FROM comprobante WHERE tipo='ARREGLO'",Integer.class));
        assertEquals(3,jdbc.queryForObject("SELECT (documento->'lineas'->0->>'cantidad')::int FROM comprobante WHERE tipo='ARREGLO'",Integer.class));
    }
    @Test void comprobantesValidanDatosYPermisosSinModificarInventario() {
        var c=ctx.getBean(ComprobanteController.class);int cancelado=pedido("CANCELADO",cliente,"2030-10-08 10:00:00",5),sinPrecio=evento("PENDIENTE",cliente,null,"2030-10-08 10:00:00",null);
        assertThrows(IllegalArgumentException.class,()->c.emitir(new ComprobanteController.Emitir("PEDIDO",cancelado)));assertThrows(IllegalArgumentException.class,()->c.emitir(new ComprobanteController.Emitir("EVENTO",sinPrecio)));assertThrows(IllegalArgumentException.class,()->c.emitir(new ComprobanteController.Emitir("INVALIDO",1)));
        int valido=pedido("ENTREGADO",cliente,"2030-10-08 10:00:00",5);rol("CLIENTE");assertThrows(AccessDeniedException.class,()->c.emitir(new ComprobanteController.Emitir("PEDIDO",valido)));rol("EMPLEADO");c.emitir(new ComprobanteController.Emitir("PEDIDO",valido));assertThrows(AccessDeniedException.class,()->ctx.getBean(ReporteController.class).exportacion("MES","2030-10-08"));assertEquals(100,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor));
    }
    @Test void historialComprobantesSePaginaYFiltraFechaDeGuatemala() {
        var c=ctx.getBean(ComprobanteController.class);for(int n=0;n<12;n++)c.emitir(new ComprobanteController.Emitir("PEDIDO",pedido("PENDIENTE",cliente,"2030-10-08 10:00:00",5)));
        jdbc.update("UPDATE comprobante SET emitido_en='2030-11-01 01:00:00+00'");
        assertEquals(12L,c.pagina(0,10,"PEDIDO","2030-10","").get("totalElementos"));assertEquals(10,((List<?>)c.pagina(0,10,"","2030-10","").get("contenido")).size());assertEquals(0L,c.pagina(0,10,"","2030-11","").get("totalElementos"));assertEquals(0L,c.pagina(0,10,"","","%").get("totalElementos"));assertEquals(1,c.pagina(99,10,"","","").get("pagina"));
    }
    @Test void exportacionIncluyeMermaDeTodasLasPaginasYSinCostosInventados() {
        for(int n=0;n<75;n++)merma(flor,2,"2030-10-08 10:00:00");var r=ctx.getBean(ReporteController.class).exportacion("MES","2030-10-08");assertEquals(75,((List<?>)r.get("mermas")).size());assertNull(((Map<?,?>)((List<?>)r.get("mermas")).getFirst()).get("importe"));assertEquals(10,((List<?>)service.mermas("MES","2030-10-08",0,10).get("contenido")).size());
        assertEquals(0,((List<?>)ctx.getBean(ReporteController.class).exportacion("DIA","2030-10-09").get("mermas")).size());
    }
    @Test void exportacionNoTruncaSilenciosamentePeriodosGrandes() {
        jdbc.update("INSERT INTO movimiento_inventario(id_flor,tipo_movimiento,motivo,cantidad,fecha) SELECT ?,'SALIDA','MERMA',1,'2030-10-08'::timestamp FROM generate_series(1,10001)",flor);
        assertThrows(IllegalArgumentException.class,()->service.exportacion("MES","2030-10-08"));
    }

    @Test void emisionSimultaneaDeLaMismaOperacionNoDuplicaDocumento() throws Exception {
        int id=pedido("ENTREGADO",cliente,"2030-10-08 10:00:00",5);var preparados=new CountDownLatch(2);var iniciar=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)){
            Callable<Long> tarea=()->{rol("EMPLEADO");try{preparados.countDown();assertTrue(iniciar.await(5,TimeUnit.SECONDS));return ((Number)ctx.getBean(ComprobanteService.class).emitir("PEDIDO",id).get("id")).longValue();}finally{SecurityContextHolder.clearContext();}};
            var a=pool.submit(tarea);var b=pool.submit(tarea);assertTrue(preparados.await(5,TimeUnit.SECONDS));iniciar.countDown();assertEquals(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS));
        }
        assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM comprobante",Integer.class));
    }
}
