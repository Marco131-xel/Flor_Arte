package com.florarte.backend.support;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.ResourceLock;
import static org.junit.jupiter.api.Assertions.*;
@ResourceLock(PostgresTemporal.RECURSO)
class PostgresTemporalTest {
  String anterior;
  @BeforeEach void guardar(){anterior=System.getProperty("florarte.test.db");}
  @AfterEach void restaurar(){if(anterior==null)System.clearProperty("florarte.test.db");else System.setProperty("florarte.test.db",anterior);}
  @Test void aceptaSoloUrlLocalExacta(){
    System.setProperty("florarte.test.db","jdbc:postgresql://127.0.0.1:5544/florarte_test");
    assertEquals("jdbc:postgresql://127.0.0.1:5544/florarte_test",PostgresTemporal.url());
  }
  @Test void bloqueaHostsBasesParametrosYPuertosOmitidos(){
    for(String u:new String[]{"jdbc:postgresql://db:5432/florarte_test","jdbc:postgresql://127.0.0.1:5544/otra_base","jdbc:postgresql://localhost:5544/florarte_test?x=1","jdbc:postgresql://localhost/florarte_test"}){
      System.setProperty("florarte.test.db",u);assertThrows(IllegalStateException.class,PostgresTemporal::url);
    }
  }
  @Test void ausenciaDePropiedadNoPermiteConectar(){System.clearProperty("florarte.test.db");assertThrows(org.opentest4j.TestAbortedException.class,PostgresTemporal::url);}

  @Test void rechazaClusterDistintoAunqueNombreYUsuarioCoincidan() throws Exception {
    var c=org.mockito.Mockito.mock(java.sql.Connection.class);
    var st=org.mockito.Mockito.mock(java.sql.Statement.class);
    var rs=org.mockito.Mockito.mock(java.sql.ResultSet.class);
    org.mockito.Mockito.when(c.createStatement()).thenReturn(st);
    org.mockito.Mockito.when(st.executeQuery(org.mockito.ArgumentMatchers.anyString())).thenReturn(rs);
    org.mockito.Mockito.when(rs.next()).thenReturn(true);
    org.mockito.Mockito.when(rs.getString(1)).thenReturn("florarte_test");
    org.mockito.Mockito.when(rs.getString(2)).thenReturn("florarte_test");
    org.mockito.Mockito.when(rs.getString(3)).thenReturn("222");
    assertThrows(java.sql.SQLException.class,()->PostgresTemporal.verificar(c,"111"));
    org.mockito.Mockito.verify(c).close();
  }
  @Test void aceptaConexionSoloConIdentidadEsperada() throws Exception {
    var c=org.mockito.Mockito.mock(java.sql.Connection.class);
    var st=org.mockito.Mockito.mock(java.sql.Statement.class);
    var rs=org.mockito.Mockito.mock(java.sql.ResultSet.class);
    org.mockito.Mockito.when(c.createStatement()).thenReturn(st);
    org.mockito.Mockito.when(st.executeQuery(org.mockito.ArgumentMatchers.anyString())).thenReturn(rs);
    org.mockito.Mockito.when(rs.next()).thenReturn(true);
    org.mockito.Mockito.when(rs.getString(1)).thenReturn("florarte_test");
    org.mockito.Mockito.when(rs.getString(2)).thenReturn("florarte_test");
    org.mockito.Mockito.when(rs.getString(3)).thenReturn("111");
    assertDoesNotThrow(()->PostgresTemporal.verificar(c,"111"));
    org.mockito.Mockito.verify(c,org.mockito.Mockito.never()).close();
  }
}
