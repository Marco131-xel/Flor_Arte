package com.florarte.backend.services;

import com.florarte.backend.controllers.*;
import com.florarte.backend.dtos.*;
import java.math.BigDecimal;
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
class ArregloTest {
    static DriverManagerDataSource ds;
    JdbcTemplate jdbc; AnnotationConfigApplicationContext ctx; ArregloService service;
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
        ctx.registerBean(ArregloService.class);ctx.registerBean(ArregloController.class);ctx.registerBean(PedidoArregloController.class);ctx.refresh();
        service=ctx.getBean(ArregloService.class);rol("ADMINISTRADOR");
    }
    @AfterEach void cerrar(){SecurityContextHolder.clearContext();ctx.close();}
    void rol(String rol){SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("test","test","ROLE_"+rol));}
    ArregloDTO receta(String nombre,int cantidad,String precio){return new ArregloDTO(nombre,null,new BigDecimal(precio),List.of(new ArregloDTO.Item(flor,cantidad)));}
    int catalogo(){return ((Number)service.guardarArreglo(null,receta("Ramo de rosas",3,"20.50")).get("idArreglo")).intValue();}
    PedidoArregloDTO venta(int arreglo,int cantidad){return new PedidoArregloDTO(cliente,empleado,arreglo,cantidad);}
    int pedir(int arreglo,int cantidad){return ((Number)service.guardarPedido(null,venta(arreglo,cantidad)).get("idPedidoArreglo")).intValue();}
    int stock(){return jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor);}
    int conteo(String tabla){return jdbc.queryForObject("SELECT count(*) FROM "+tabla,Integer.class);}
    @Test void catalogoNoConsumeYCalculaDisponibilidad(){
        int a=catalogo();assertEquals(100,stock());assertEquals(33,((Number)service.arreglo(a).get("disponibles")).intValue());
        jdbc.update("UPDATE flor SET estado=false WHERE id_flor=?",flor);assertEquals(0,((Number)service.arreglo(a).get("disponibles")).intValue());
        assertThrows(IllegalArgumentException.class,()->service.guardarArreglo(null,receta("Ramo de rosas",3,"20")));
        var duplicada=new ArregloDTO("Duplicada",null,BigDecimal.ONE,List.of(new ArregloDTO.Item(flor,1),new ArregloDTO.Item(flor,2)));
        assertThrows(IllegalArgumentException.class,()->service.guardarArreglo(null,duplicada));assertEquals(1,conteo("arreglo"));
    }
    @Test void imagenSeGuardaSeEditaYSeMuestraEnPedidosExistentes(){
        String url="https://example.test/ramo.jpg";
        int a=((Number)service.guardarArreglo(null,new ArregloDTO("Con imagen",null,BigDecimal.TEN,List.of(new ArregloDTO.Item(flor,3)),"  "+url+"  ")).get("idArreglo")).intValue();
        int p=pedir(a,1);assertEquals(url,service.arreglo(a).get("imagenUrl"));assertEquals(url,service.pedido(p).get("imagenUrl"));
        var gestion=new GestionController(new NamedParameterJdbcTemplate(ds),ctx.getBean(ReglasEdicion.class));
        for(String tipo:List.of("arreglos","pedidosArreglos")) {
            var pagina=gestion.pagina(tipo,0,10,"","","","","recientes");
            assertEquals(url,((Map<?,?>)((List<?>)pagina.get("contenido")).getFirst()).get("imagen"));
        }
        String nueva="https://example.test/nueva.jpg";
        service.guardarArreglo(a,new ArregloDTO("Con imagen",null,BigDecimal.TEN,List.of(new ArregloDTO.Item(flor,3)),nueva));assertEquals(nueva,service.pedido(p).get("imagenUrl"));
        assertThrows(IllegalArgumentException.class,()->service.guardarArreglo(a,new ArregloDTO("Con imagen",null,BigDecimal.TEN,List.of(new ArregloDTO.Item(flor,3)),"javascript:alert(1)")));
        assertEquals(nueva,service.arreglo(a).get("imagenUrl"));
        service.guardarArreglo(a,new ArregloDTO("Con imagen",null,BigDecimal.TEN,List.of(new ArregloDTO.Item(flor,3))," "));assertNull(service.pedido(p).get("imagenUrl"));assertEquals(97,stock());
    }
    @Test void precioYRecetaHistoricosYCancelacionIdempotente(){
        int a=catalogo(),p=pedir(a,2);assertEquals(94,stock());assertEquals(new BigDecimal("41.00"),service.pedido(p).get("total"));
        service.guardarArreglo(a,receta("Nuevo nombre",9,"99"));
        assertEquals("Ramo de rosas",service.pedido(p).get("nombreArreglo"));
        service.estado(p,"CANCELADO");assertEquals(100,stock());service.estado(p,"CANCELADO");assertEquals(100,stock());
        service.estado(p,"CONFIRMADO");assertEquals(94,stock());service.estado(p,"PREPARANDO");assertEquals(94,stock());
        service.guardarPedido(p,venta(a,3));assertEquals(91,stock());assertEquals(new BigDecimal("61.50"),service.pedido(p).get("total"));
        assertThrows(IllegalArgumentException.class,()->service.eliminarArreglo(a));service.eliminarPedido(p);assertEquals(100,stock());
        assertEquals(0,conteo("detalle_pedido_arreglo"));service.eliminarArreglo(a);assertEquals(0,conteo("detalle_arreglo"));
    }
    @Test void editarCanceladoNoReservaHastaReactivarNiDevuelveDosVeces(){
        int a=catalogo(),p=pedir(a,2);service.estado(p,"CANCELADO");service.guardarPedido(p,venta(a,5));assertEquals(100,stock());
        service.estado(p,"PENDIENTE");assertEquals(85,stock());service.estado(p,"CANCELADO");service.eliminarPedido(p);assertEquals(100,stock());
    }
    @Test void sinExistenciasNoCreaPedidoNiDescuentaOtrasFlores(){
        var dto=new ArregloDTO("Mixto",null,BigDecimal.TEN,List.of(new ArregloDTO.Item(flor,3),new ArregloDTO.Item(otra,11)));
        int a=((Number)service.guardarArreglo(null,dto).get("idArreglo")).intValue();
        assertThrows(IllegalArgumentException.class,()->pedir(a,1));assertEquals(100,stock());assertEquals(0,conteo("pedido_arreglo"));assertEquals(0,conteo("movimiento_inventario"));
        jdbc.update("UPDATE flor SET estado=false WHERE id_flor=?",flor);assertThrows(IllegalArgumentException.class,()->pedir(a,1));assertEquals(100,stock());
    }
    @Test void errorAlGuardarRevierteStockYMovimientos(){
        int a=catalogo();jdbc.execute("ALTER TABLE pedido_arreglo ADD CONSTRAINT fallo_prueba CHECK(cantidad<>2)");
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,()->pedir(a,2));assertEquals(100,stock());assertEquals(0,conteo("movimiento_inventario"));assertEquals(0,conteo("pedido_arreglo"));
    }
    @Test void cambioDeArregloAplicaSoloDiferenciaDeStock(){
        int a=catalogo(),p=pedir(a,2);
        int b=((Number)service.guardarArreglo(null,new ArregloDTO("Otro",null,BigDecimal.TEN,List.of(new ArregloDTO.Item(otra,2)))).get("idArreglo")).intValue();
        service.guardarPedido(p,venta(b,3));assertEquals(100,stock());assertEquals(4,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,otra));
        service.eliminarPedido(p);assertEquals(10,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,otra));
    }
    @Test void empleadoCambiaEstadoFueraDelPlazoPeroNoDatosNiElimina(){
        int a=catalogo(),p=pedir(a,1);rol("EMPLEADO");
        var ep=ctx.getBean(PedidoArregloController.class);var ec=ctx.getBean(ArregloController.class);
        ep.editar(p,venta(a,2));assertEquals(94,stock());
        jdbc.update("UPDATE pedido_arreglo SET creado_en=now()-interval '31 minutes' WHERE id_pedido_arreglo=?",p);
        jdbc.update("UPDATE arreglo SET creado_en=now()-interval '31 minutes' WHERE id_arreglo=?",a);
        assertThrows(AccessDeniedException.class,()->ep.editar(p,venta(a,3)));assertThrows(AccessDeniedException.class,()->ep.eliminar(p));
        assertThrows(AccessDeniedException.class,()->ec.editar(a,receta("Otro",3,"10")));assertThrows(AccessDeniedException.class,()->ec.eliminar(a));
        ep.estado(p,new EstadoPedidoDTO("CONFIRMADO"));assertEquals("CONFIRMADO",service.pedido(p).get("estado"));
        rol("CLIENTE");assertThrows(AccessDeniedException.class,()->ep.estado(p,new EstadoPedidoDTO("LISTO")));assertThrows(AccessDeniedException.class,()->ec.detalle(a));
        rol("ADMINISTRADOR");ep.eliminar(p);assertEquals(100,stock());
    }
    @Test void paginaMesEstadoYTotales(){
        int a=catalogo();for(int i=0;i<12;i++)pedir(a,1);
        jdbc.update("UPDATE pedido_arreglo SET fecha='2026-10-03' WHERE id_arreglo=?",a);
        var c=new GestionController(new NamedParameterJdbcTemplate(ds),ctx.getBean(ReglasEdicion.class));
        var pagina=c.pagina("pedidosArreglos",0,10,"","2026-10","PENDIENTE","","recientes");
        assertEquals(12L,pagina.get("totalElementos"));assertEquals(10,((List<?>)pagina.get("contenido")).size());
        var resumen=(Map<?,?>)pagina.get("resumen");assertEquals(12,((Number)resumen.get("unidades")).intValue());assertEquals(new BigDecimal("246.00"),resumen.get("importe"));
        assertEquals(0L,c.pagina("pedidosArreglos",0,10,"","2026-09","","","recientes").get("totalElementos"));
        assertEquals(1L,c.pagina("arreglos",0,10,"rosas","","","","nombre").get("totalElementos"));
        assertEquals(0L,c.resumen().get("pedidos"));assertEquals(12L,c.resumen().get("arreglosPendientes"));assertTrue(c.avisos().stream().anyMatch(n->n.get("ruta").toString().endsWith("/arreglos/pedidos")));
    }
    @Test void dtoRechazaObligatoriosVaciosYDecimalesFueraDeRango(){
        try(var factory=Validation.buildDefaultValidatorFactory()){
            var v=factory.getValidator();assertFalse(v.validate(new ArregloDTO(" ",null,new BigDecimal("-1"),List.of())).isEmpty());
            assertFalse(v.validate(new ArregloDTO("Ramo",null,new BigDecimal("1.001"),List.of(new ArregloDTO.Item(flor,0)))).isEmpty());
            assertFalse(v.validate(new PedidoArregloDTO(null,null,null,0)).isEmpty());assertTrue(v.validate(venta(1,1)).isEmpty());
        }
    }
    @Test void ventasConcurrentesNoConsumenLasMismasUltimasFlores() throws Exception {
        int a=catalogo();jdbc.update("UPDATE flor SET stock=3 WHERE id_flor=?",flor);
        var inicio=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)){
            Callable<Boolean> vender=()->{rol("ADMINISTRADOR");try{inicio.await();pedir(a,1);return true;}catch(IllegalArgumentException ex){return false;}finally{SecurityContextHolder.clearContext();}};
            var uno=pool.submit(vender);var dos=pool.submit(vender);inicio.countDown();
            assertNotEquals(uno.get(10,TimeUnit.SECONDS),dos.get(10,TimeUnit.SECONDS));
        }
        assertEquals(0,stock());assertEquals(1,conteo("pedido_arreglo"));assertEquals(1,conteo("movimiento_inventario"));
    }
}
