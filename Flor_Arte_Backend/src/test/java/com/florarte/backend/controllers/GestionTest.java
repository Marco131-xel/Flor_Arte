package com.florarte.backend.controllers;

import com.florarte.backend.services.ReglasEdicion;
import com.florarte.backend.services.FlorService;
import java.sql.Timestamp;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.FileSystemResource;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Uses a separate test database and resets its public schema before each test. */
class GestionTest {
    static DriverManagerDataSource ds;
    JdbcTemplate jdbc; ReglasEdicion reglas; GestionController controller;
    @BeforeAll static void conexion() {
        String url=System.getProperty("florarte.test.db");
        Assumptions.assumeTrue(url!=null && url.matches("jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/florarte_test"), "Requiere una base temporal local llamada florarte_test");
        ds=new DriverManagerDataSource(url,"florarte_test","");
    }
    @BeforeEach void preparar() {
        jdbc=new JdbcTemplate(ds);
        jdbc.execute("DROP SCHEMA public CASCADE"); jdbc.execute("CREATE SCHEMA public");
        var files=new java.io.File("src/main/resources/db/migration").listFiles((dir,name)->name.endsWith(".sql"));
        Arrays.sort(files,Comparator.comparingInt(f->Integer.parseInt(f.getName().substring(1,f.getName().indexOf("__")))));
        for(var file:files)new ResourceDatabasePopulator(new FileSystemResource(file)).execute(ds);
        reglas=new ReglasEdicion(jdbc); controller=new GestionController(new NamedParameterJdbcTemplate(ds),reglas);
        rol("ADMINISTRADOR");
        jdbc.update("INSERT INTO persona(nombre,id_rol,correo) VALUES ('Proveedor Test',4,'prov@test'),('Cliente Test',3,'cliente@test')");
        jdbc.update("INSERT INTO flor(id_tipo_flor,id_color,precio,stock) VALUES (1,1,10,100)");
        long cliente=jdbc.queryForObject("SELECT id_persona FROM persona WHERE correo='cliente@test'",Long.class);
        for(int i=1;i<=25;i++)jdbc.update("INSERT INTO pedido(id_cliente,estado,total,fecha) VALUES (?,'PENDIENTE',10,?)",cliente,Timestamp.valueOf("2026-10-"+String.format("%02d",i)+" 12:00:00"));
        jdbc.update("INSERT INTO pedido(id_cliente,estado,total,fecha) VALUES (?,'ENTREGADO',99,'2026-09-30 23:59:59')",cliente);
    }
    void rol(String rol){SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("test","test","ROLE_"+rol));}
    @AfterEach void limpiar(){SecurityContextHolder.clearContext();}
    Map<String,Object> pagina(String tipo,int numero,String mes,String estado){return controller.pagina(tipo,numero,10,"",mes,estado,"","recientes");}
    @Test void paginaRealYTotalesDeTodoElMes(){
        var result=pagina("pedidos",0,"2026-10","");
        assertEquals(25L,result.get("totalElementos"));assertEquals(3,result.get("totalPaginas"));
        assertEquals(10,((List<?>)result.get("contenido")).size());
        assertEquals(250,((Number)((Map<?,?>)result.get("resumen")).get("importe")).intValue());
        var ultima=pagina("pedidos",99,"2026-10","");assertEquals(2,ultima.get("pagina"));assertEquals(5,((List<?>)ultima.get("contenido")).size());
    }
    @Test void filtrosSonDelServidorYMesNoSeMezcla(){
        assertEquals(0L,pagina("pedidos",0,"2026-10","ENTREGADO").get("totalElementos"));
        assertEquals(1L,pagina("pedidos",0,"2026-09","ENTREGADO").get("totalElementos"));
        assertThrows(IllegalArgumentException.class,()->pagina("pedidos",0,"2026-99",""));
        assertThrows(IllegalArgumentException.class,()->controller.pagina("pedidos",0,1000,"","","","","recientes"));
        assertEquals(0L,controller.pagina("pedidos",0,10,"%","","","","recientes").get("totalElementos"));
    }
    @Test void empleadoNoPuedeConsultarUsuariosNiRolesInternos(){
        rol("EMPLEADO");
        assertThrows(AccessDeniedException.class,()->pagina("usuarios",0,"",""));
        assertEquals(0L,controller.pagina("personas",0,10,"","","","ADMINISTRADOR","recientes").get("totalElementos"));
    }
    @Test void columnasDeCreacionNoCambianConFechaComercial(){
        int id=jdbc.queryForObject("SELECT min(id_pedido) FROM pedido",Integer.class);
        jdbc.update("UPDATE pedido SET creado_en=now()-interval '31 minutes',fecha=now() WHERE id_pedido=?",id);
        rol("EMPLEADO"); assertFalse(reglas.editar("pedidos",id));
        rol("ADMINISTRADOR");assertTrue(reglas.editar("pedidos",id));
    }
    @Test void inventarioYMermasFiltranMesYCalculanTotales() {
        int proveedor=jdbc.queryForObject("SELECT id_persona FROM persona WHERE correo='prov@test'",Integer.class);
        int flor=jdbc.queryForObject("SELECT min(id_flor) FROM flor",Integer.class);
        jdbc.update("INSERT INTO entrada_inventario(id_persona,total,fecha) VALUES (?,80,'2026-10-01'),(?,20,'2026-09-30')",proveedor,proveedor);
        jdbc.update("INSERT INTO movimiento_inventario(id_flor,tipo_movimiento,motivo,cantidad,fecha) VALUES (?,'SALIDA','MERMA',3,'2026-10-01'),(?,'SALIDA','MERMA',7,'2026-09-30'),(?,'SALIDA','VENTA',4,'2026-10-02')",flor,flor,flor);
        var entradas=pagina("inventario",0,"2026-10","");
        assertEquals(1L,entradas.get("totalElementos"));
        assertEquals(80,((Number)((Map<?,?>)entradas.get("resumen")).get("importe")).intValue());
        var mermas=pagina("mermas",0,"2026-10","");
        assertEquals(1L,mermas.get("totalElementos"));
        assertEquals(3,((Number)((Map<?,?>)mermas.get("resumen")).get("unidades")).intValue());
    }
    @Test void catalogoYDirectoriosConservanCamposYPermisos() {
        rol("EMPLEADO");
        var flores=pagina("flores",0,"","");
        var flor=(Map<?,?>)((List<?>)flores.get("contenido")).getFirst();
        assertEquals(true,flor.get("puedeEditar"));assertNotNull(flor.get("editableHasta"));
        assertEquals(1000,((Number)((Map<?,?>)flores.get("resumen")).get("importe")).intValue());
        assertEquals(2L,pagina("personas",0,"","").get("totalElementos"));
        rol("ADMINISTRADOR");
        var usuarios=pagina("usuarios",0,"","");
        for(var usuario:(List<?>)usuarios.get("contenido")) assertFalse(((Map<?,?>)usuario).containsKey("password"));
    }
    @Configuration @EnableMethodSecurity static class Seguridad {}
    @Test void seguridadDeEndpointImpideEludirPlazoYEliminar(){
        int id=jdbc.queryForObject("SELECT min(id_flor) FROM flor",Integer.class);
        jdbc.update("UPDATE flor SET creado_en=now()-interval '31 minutes' WHERE id_flor=?",id);
        try(var ctx=new AnnotationConfigApplicationContext()){
            ctx.register(Seguridad.class);
            ctx.registerBean("reglasEdicion",ReglasEdicion.class,()->reglas);
            FlorService service=mock(FlorService.class);
            ctx.registerBean(FlorService.class,()->service);
            ctx.registerBean(FlorController.class);
            ctx.refresh();var endpoint=ctx.getBean(FlorController.class);
            rol("EMPLEADO");
            assertThrows(AccessDeniedException.class,()->endpoint.updateFlor(id,null));
            assertThrows(AccessDeniedException.class,()->endpoint.deleteFlor(id));
            verifyNoInteractions(service);
            rol("ADMINISTRADOR");endpoint.deleteFlor(id);verify(service).deleteById(id);
        }
    }
    @Test void catalogoTienePaginacionRealYBusqueda() {
        var pagina=controller.pagina("tipoflor",0,10,"","","","","nombre");
        assertTrue(((Number)pagina.get("totalElementos")).longValue()>10);
        assertEquals(10,((List<?>)pagina.get("contenido")).size());
        var siguiente=controller.pagina("tipoflor",1,10,"","","","","nombre");
        var primero=(Map<?,?>)((List<?>)pagina.get("contenido")).getFirst();
        var otro=(Map<?,?>)((List<?>)siguiente.get("contenido")).getFirst();
        assertNotEquals(primero.get("id"),otro.get("id"));
        assertEquals(1L,controller.pagina("tipoflor",0,10,"Tulipán","","","","nombre").get("totalElementos"));
    }
    @Test void postgresAdmiteVariasPersonasSinDpiYCorreo() {
        jdbc.update("INSERT INTO persona(nombre,id_rol) VALUES ('Sin DPI Uno',3),('Sin DPI Dos',3)");
        jdbc.update("UPDATE persona SET nombre='Sin DPI editado',dpi=NULL,correo=NULL WHERE nombre='Sin DPI Uno'");
        assertEquals(2,jdbc.queryForObject("SELECT count(*) FROM persona WHERE nombre LIKE 'Sin DPI%' AND dpi IS NULL AND correo IS NULL",Integer.class));
    }
    @Test void empleadoPuedeEliminarDentroDelPlazoYSeBloqueaDespues() {
        int id=jdbc.queryForObject("SELECT min(id_flor) FROM flor",Integer.class);
        try(var ctx=new AnnotationConfigApplicationContext()) {
            ctx.register(Seguridad.class);ctx.registerBean("reglasEdicion",ReglasEdicion.class,()->reglas);
            FlorService service=mock(FlorService.class);ctx.registerBean(FlorService.class,()->service);ctx.registerBean(FlorController.class);ctx.refresh();
            var endpoint=ctx.getBean(FlorController.class);rol("EMPLEADO");
            endpoint.deleteFlor(id);verify(service).deleteById(id);clearInvocations(service);
            jdbc.update("UPDATE flor SET creado_en=now()-interval '31 minutes' WHERE id_flor=?",id);
            assertThrows(AccessDeniedException.class,()->endpoint.deleteFlor(id));verifyNoInteractions(service);
        }
    }
    @Test void avisosYResumenNoDescarganHistorialCompleto(){
        assertEquals(25L,controller.resumen().get("pedidos"));
        long pendientes=controller.avisos().stream().filter(a->a.get("tipo").equals("pedido")).count();
        assertEquals(5,pendientes);
    }
}
