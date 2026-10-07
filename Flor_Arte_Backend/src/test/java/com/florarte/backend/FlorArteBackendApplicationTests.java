package com.florarte.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import com.florarte.backend.services.ArregloService;
import com.florarte.backend.dtos.ArregloDTO;
import com.florarte.backend.dtos.PedidoArregloDTO;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@EnabledIfSystemProperty(named="florarte.test.db", matches="jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/florarte_test")
class FlorArteBackendApplicationTests {
    @Autowired JdbcTemplate jdbc;
    @Autowired ArregloService arreglos;
    @Autowired com.florarte.backend.services.EventoService eventos;

    @DynamicPropertySource
    static void baseTemporal(DynamicPropertyRegistry props) {
        props.add("spring.datasource.url",()->System.getProperty("florarte.test.db"));
        props.add("spring.datasource.username",()->"florarte_test");
        props.add("spring.datasource.password",()->"");
    }

	@Test
	void contextLoads() {
	}

    @Test @Transactional
    void arreglosUsanLaTransaccionDelSistema() {
        long cliente=jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES ('Cliente prueba arranque',3) RETURNING id_persona",Long.class);
        int flor=jdbc.queryForObject("INSERT INTO flor(id_tipo_flor,id_color,precio,stock) VALUES (1,1,10,100) RETURNING id_flor",Integer.class);
        int arreglo=((Number)arreglos.guardarArreglo(null,new ArregloDTO("Prueba transaccional",null,BigDecimal.TEN,List.of(new ArregloDTO.Item(flor,3)))).get("idArreglo")).intValue();
        int pedido=((Number)arreglos.guardarPedido(null,new PedidoArregloDTO(cliente,null,arreglo,2)).get("idPedidoArreglo")).intValue();
        assertEquals(94,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor));
        arreglos.estado(pedido,"CANCELADO");
        assertEquals(100,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor));
    }

    @Test @Transactional
    void eventosUsanLaTransaccionDelSistema() {
        long cliente=jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES ('Cliente evento prueba',3) RETURNING id_persona",Long.class);
        int flor=jdbc.queryForObject("INSERT INTO flor(id_tipo_flor,id_color,precio,stock) VALUES (1,1,10,100) RETURNING id_flor",Integer.class);
        int id=((Number)eventos.guardar(null,new com.florarte.backend.dtos.EventoDTO("Evento transaccional",cliente,null,java.time.LocalDateTime.now(),1,null,null,List.of(new com.florarte.backend.dtos.EventoDTO.Item(flor,20)))).get("idEvento")).intValue();
        assertEquals(100,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor));
        eventos.estado(id,"CONFIRMADO");assertEquals(80,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor));
        eventos.estado(id,"CANCELADO");assertEquals(100,jdbc.queryForObject("SELECT stock FROM flor WHERE id_flor=?",Integer.class,flor));
    }

}
