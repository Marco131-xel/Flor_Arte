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
class EventoTest {
    static DriverManagerDataSource ds;
    JdbcTemplate jdbc; AnnotationConfigApplicationContext ctx; EventoService service;
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
        ctx.registerBean(EventoService.class);ctx.registerBean(EventoController.class);ctx.refresh();
        service=ctx.getBean(EventoService.class);rol("ADMINISTRADOR");
    }
    @AfterEach void cerrar(){SecurityContextHolder.clearContext();ctx.close();}
    void rol(String rol){SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("test","test","ROLE_"+rol));}
    EventoDTO datos(LocalDateTime fecha,int cantidad,int dias){return new EventoDTO("Boda de Ana",cliente,empleado,fecha,dias,"Centros de mesa","Salón principal",List.of(new EventoDTO.Item(flor,cantidad)),new java.math.BigDecimal("100.00"));}
    LocalDateTime hoy(){return LocalDate.now(ZoneId.of("America/Guatemala")).atTime(10,0);}
    int crear(LocalDateTime fecha,int cantidad,int dias){return ((Number)service.guardar(null,datos(fecha,cantidad,dias)).get("idEvento")).intValue();}
    int stock(){return jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor);}
    int conteo(String tabla){return jdbc.queryForObject("SELECT count(*) FROM "+tabla,Integer.class);}
    @Test void solicitudLejanaRegistraNecesidadSinDescontar(){
        int id=crear(hoy().plusMonths(8),150,3);assertEquals(100,stock());assertEquals("PENDIENTE",service.detalle(id).get("estado"));assertEquals(false,service.detalle(id).get("reservaAplicada"));assertEquals(0,conteo("movimiento_inventario"));
        assertEquals(hoy().plusMonths(8).minusDays(3).toLocalDate().toString(),service.detalle(id).get("inicioPreparacion"));
        assertThrows(IllegalArgumentException.class,()->service.estado(id,"CONFIRMADO"));assertEquals(100,stock());assertEquals("PENDIENTE",service.detalle(id).get("estado"));
    }
    @Test void confirmarYCancelaUnaSolaVez(){
        int id=crear(hoy().plusDays(2),30,1);service.estado(id,"CONFIRMADO");assertEquals(70,stock());service.estado(id,"CONFIRMADO");assertEquals(70,stock());assertEquals(1,conteo("movimiento_inventario"));
        service.estado(id,"CANCELADO");assertEquals(100,stock());service.estado(id,"CANCELADO");assertEquals(100,stock());service.eliminar(id);assertEquals(100,stock());assertEquals(0,conteo("detalle_evento"));
    }
    @Test void editarSoloReservaLaDiferencia(){
        int id=crear(hoy(),20,1);service.guardar(id,datos(hoy(),30,2));assertEquals(100,stock());service.estado(id,"CONFIRMADO");assertEquals(70,stock());service.guardar(id,datos(hoy(),40,2));assertEquals(60,stock());service.guardar(id,datos(hoy(),10,2));assertEquals(90,stock());
        service.eliminar(id);assertEquals(100,stock());
    }
    @Test void falloPosteriorAlDescuentoRevierteTodo(){
        int id=crear(hoy(),30,0);jdbc.execute("ALTER TABLE evento ADD CONSTRAINT fallo_prueba CHECK(estado<>'CONFIRMADO')");assertThrows(org.springframework.dao.DataIntegrityViolationException.class,()->service.estado(id,"CONFIRMADO"));assertEquals(100,stock());assertEquals(0,conteo("movimiento_inventario"));assertEquals("PENDIENTE",service.detalle(id).get("estado"));
    }
    @Test void eventoRealizadoConservaConsumoYNoSeCancelaNiElimina(){
        int id=crear(hoy(),20,1);assertThrows(IllegalArgumentException.class,()->service.estado(id,"PAGADO"));service.estado(id,"CONFIRMADO");service.estado(id,"TRABAJANDO");service.estado(id,"REALIZADO");service.estado(id,"PAGADO");assertEquals(80,stock());assertEquals(1,conteo("movimiento_inventario"));
        assertThrows(IllegalArgumentException.class,()->service.estado(id,"CANCELADO"));assertThrows(IllegalArgumentException.class,()->service.eliminar(id));assertThrows(IllegalArgumentException.class,()->service.guardar(id,datos(hoy(),21,1)));assertEquals(80,stock());
        service.guardar(id,datos(hoy(),20,2));assertEquals(80,stock());
    }
    @Test void noSeMarcaTrabajandoAntesDelDiaDelEvento(){int id=crear(hoy().plusDays(1),20,1);service.estado(id,"CONFIRMADO");assertThrows(IllegalArgumentException.class,()->service.estado(id,"TRABAJANDO"));assertEquals("CONFIRMADO",service.detalle(id).get("estado"));assertEquals(80,stock());}
    @Test void cancelarYReabrirMantienePlanificacionSinDobleReserva(){int id=crear(hoy(),20,1);service.estado(id,"CONFIRMADO");service.estado(id,"CANCELADO");service.estado(id,"PENDIENTE");assertEquals(100,stock());service.estado(id,"CONFIRMADO");assertEquals(80,stock());}
    @Test void cantidadesDuplicadasEInvalidasNoCreanCabecera(){
        var dto=new EventoDTO("Boda",cliente,empleado,hoy(),1,null,null,List.of(new EventoDTO.Item(flor,1),new EventoDTO.Item(flor,2)));assertThrows(IllegalArgumentException.class,()->service.guardar(null,dto));assertEquals(0,conteo("evento"));
        assertThrows(IllegalArgumentException.class,()->service.guardar(null,datos(hoy(),0,0)));assertEquals(100,stock());
    }
    @Test void insuficienciaDeOtraFlorNoDescuentaLaPrimera(){
        var dto=new EventoDTO("Mixto",cliente,empleado,hoy(),0,null,null,List.of(new EventoDTO.Item(flor,20),new EventoDTO.Item(otra,11)));int id=((Number)service.guardar(null,dto).get("idEvento")).intValue();assertThrows(IllegalArgumentException.class,()->service.estado(id,"CONFIRMADO"));assertEquals(100,stock());assertEquals(0,conteo("movimiento_inventario"));
    }
    @Test void empleadoCambiaEstadoSinPlazoPeroNoEditaNiElimina(){
        int id=crear(hoy(),20,0);var endpoint=ctx.getBean(EventoController.class);rol("EMPLEADO");endpoint.editar(id,datos(hoy(),25,0));assertEquals(100,stock());
        jdbc.update("UPDATE evento SET creado_en=now()-interval '31 minutes',fecha=now() WHERE id_evento=?",id);
        assertThrows(AccessDeniedException.class,()->endpoint.editar(id,datos(hoy(),30,0)));assertThrows(AccessDeniedException.class,()->endpoint.eliminar(id));endpoint.estado(id,new EstadoEventoDTO("CONFIRMADO"));assertEquals(75,stock());
        rol("CLIENTE");assertThrows(AccessDeniedException.class,()->endpoint.estado(id,new EstadoEventoDTO("CANCELADO")));assertThrows(AccessDeniedException.class,()->endpoint.detalle(id));rol("ADMINISTRADOR");endpoint.eliminar(id);assertEquals(100,stock());
    }
    @Test void calendarioAgregaPorDiaYPreparacionCruzaMes(){
        int id=crear(LocalDateTime.of(2030,11,2,10,0),20,5);service.estado(id,"CONFIRMADO");
        var noviembre=service.calendario(2030,11,"","");var dia=(Map<?,?>)((List<?>)noviembre.get("dias")).getFirst();assertEquals("2030-11-02",dia.get("dia"));assertEquals(20,((Number)dia.get("floresReservadas")).intValue());
        var octubre=service.calendario(2030,10,"","");assertTrue(((List<?>)octubre.get("dias")).isEmpty());assertEquals("2030-10-28",((Map<?,?>)((List<?>)octubre.get("preparacion")).getFirst()).get("dia"));
        assertEquals(1L,service.pagina(2030,10,"2030-10-28","","",0,10,true).get("totalElementos"));assertEquals(0L,service.pagina(2030,10,"2030-10-28","","",0,10,false).get("totalElementos"));
    }
    @Test void paginaMesDiaAnioYEstadosConTotalesDelFiltro(){
        for(int i=0;i<25;i++)crear(LocalDateTime.of(2030,10,6,10,0),1,2);crear(LocalDateTime.of(2030,11,1,10,0),1,0);
        var p=service.pagina(2030,10,"","","",0,10,false);assertEquals(25L,p.get("totalElementos"));assertEquals(10,((List<?>)p.get("contenido")).size());assertEquals(25L,((Map<?,?>)p.get("resumen")).get("pendientes"));
        assertEquals(2,service.pagina(2030,10,"","","",99,10,false).get("pagina"));assertEquals(26L,service.pagina(2030,0,"","","",0,10,false).get("totalElementos"));
        assertEquals(25L,service.pagina(2030,10,"2030-10-06","PENDIENTE","Ana",0,10,false).get("totalElementos"));assertEquals(0L,service.pagina(2030,10,"2030-10-07","","",0,10,false).get("totalElementos"));
        assertEquals(0L,service.pagina(2030,10,"","CONFIRMADO","",0,10,false).get("totalElementos"));assertEquals(0L,service.pagina(2030,10,"","","%",0,10,false).get("totalElementos"));
        assertThrows(IllegalArgumentException.class,()->service.pagina(2030,10,"2030-11-01","","",0,10,false));assertThrows(IllegalArgumentException.class,()->service.calendario(2030,13,"",""));
    }
    @Test void validacionDeDtoObligatoriosYCantidades(){
        try(var factory=Validation.buildDefaultValidatorFactory()){var v=factory.getValidator();assertFalse(v.validate(new EventoDTO(" ",null,null,null,-1,null,null,List.of())).isEmpty());assertFalse(v.validate(new EventoDTO("Boda",cliente,empleado,hoy(),1,null,null,List.of(new EventoDTO.Item(flor,0)))).isEmpty());assertTrue(v.validate(datos(hoy(),1,0)).isEmpty());}
    }
    @Test void eventosProximosAparecenEnInicioYAvisosAcotados(){
        crear(hoy().plusDays(2),20,1);crear(hoy().plusMonths(2),20,1);
        int cancelado=crear(hoy().plusDays(1),20,0);service.estado(cancelado,"CANCELADO");
        var gestion=new GestionController(new NamedParameterJdbcTemplate(ds),ctx.getBean(ReglasEdicion.class));
        assertEquals(1L,gestion.resumen().get("eventos"));
        var avisos=gestion.avisos().stream().filter(a->"evento".equals(a.get("tipo"))).toList();assertEquals(1,avisos.size());assertEquals("/admin/eventos",avisos.getFirst().get("ruta"));
        rol("EMPLEADO");assertEquals("/empleado/eventos",gestion.avisos().stream().filter(a->"evento".equals(a.get("tipo"))).findFirst().orElseThrow().get("ruta"));
    }
    @Test void pagoExigeImporteYFechaDePagoNoSeReescribe(){
        var dto=new EventoDTO("Sin importe",cliente,empleado,hoy(),0,null,null,List.of(new EventoDTO.Item(flor,20)));
        int id=((Number)service.guardar(null,dto).get("idEvento")).intValue();
        service.estado(id,"CONFIRMADO");service.estado(id,"TRABAJANDO");service.estado(id,"REALIZADO");
        assertThrows(IllegalArgumentException.class,()->service.estado(id,"PAGADO"));assertEquals("REALIZADO",service.detalle(id).get("estado"));assertEquals(80,stock());
        var pagado=service.estado(id,"PAGADO",new java.math.BigDecimal("250.50"));assertEquals(new java.math.BigDecimal("250.50"),pagado.get("importe"));assertNotNull(pagado.get("fechaPago"));
        service.estado(id,"PAGADO");assertEquals(pagado.get("fechaPago"),service.detalle(id).get("fechaPago"));
        assertThrows(IllegalArgumentException.class,()->service.estado(id,"PAGADO",new java.math.BigDecimal("999")));assertEquals(80,stock());
    }
    @Test void empleadoRegistraPagoConImporteFueraDelPlazoSinModificarFlores(){
        var dto=new EventoDTO("Pago tardío",cliente,empleado,hoy(),0,null,null,List.of(new EventoDTO.Item(flor,20)));
        int id=((Number)service.guardar(null,dto).get("idEvento")).intValue();service.estado(id,"CONFIRMADO");service.estado(id,"TRABAJANDO");service.estado(id,"REALIZADO");jdbc.update("UPDATE evento SET creado_en=now()-interval '31 minutes' WHERE id_evento=?",id);
        rol("EMPLEADO");var endpoint=ctx.getBean(EventoController.class);endpoint.estado(id,new EstadoEventoDTO("PAGADO",new java.math.BigDecimal("100")));assertEquals(80,stock());assertEquals("PAGADO",service.detalle(id).get("estado"));
        assertThrows(AccessDeniedException.class,()->endpoint.editar(id,datos(hoy(),20,0)));
    }
    @Test void importeNegativoNoGuardaYElAcordadoSeConservaAlPagar(){
        var negativo=new EventoDTO("Inválido",cliente,empleado,hoy(),0,null,null,List.of(new EventoDTO.Item(flor,20)),new java.math.BigDecimal("-1"));assertThrows(IllegalArgumentException.class,()->service.guardar(null,negativo));assertEquals(0,conteo("evento"));
        int id=crear(hoy(),20,0);service.estado(id,"CONFIRMADO");service.estado(id,"TRABAJANDO");service.estado(id,"REALIZADO");assertThrows(IllegalArgumentException.class,()->service.estado(id,"PAGADO",new java.math.BigDecimal("101")));service.estado(id,"PAGADO");assertEquals(new java.math.BigDecimal("100.00"),service.detalle(id).get("importe"));assertEquals(80,stock());
    }
    @Test void reservasSimultaneasNoUsanLasMismasFlores() throws Exception {
        int a=crear(hoy(),70,0),b=crear(hoy(),70,0);var inicio=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)){java.util.function.IntFunction<Callable<Boolean>> tarea=id->()->{rol("ADMINISTRADOR");try{inicio.await();service.estado(id,"CONFIRMADO");return true;}catch(IllegalArgumentException ex){return false;}finally{SecurityContextHolder.clearContext();}};
            var uno=pool.submit(tarea.apply(a));var dos=pool.submit(tarea.apply(b));inicio.countDown();assertNotEquals(uno.get(10,TimeUnit.SECONDS),dos.get(10,TimeUnit.SECONDS));}
        assertEquals(30,stock());assertEquals(1,conteo("movimiento_inventario"));
    }
}
