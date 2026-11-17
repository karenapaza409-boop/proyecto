package pe.edu.cantomoda;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import pe.edu.cantomoda.ventas.service.ClienteService;
import static org.assertj.core.api.Assertions.*;
/** Solo lectura, sin fixtures, cambios de contactos o documentos ni DDL. */
@SpringBootTest @ActiveProfiles("oracle-it")
class ClienteOracleLecturaIT {
 @Autowired ClienteService clientes; @Autowired JdbcTemplate jdbc;
 @Test void listadoBusquedaYLecturaEnOracle(){
  var page=clientes.buscar(null,null,0,20);
  assertThat(page.totalElements()).isEqualTo(jdbc.queryForObject("SELECT COUNT(*) FROM MM_VENTAS.CLIENTES",Long.class));
  for(var c:page.content()){assertThat(clientes.obtener(c.id()).id()).isEqualTo(c.id());assertThat(clientes.buscar(c.documento(),null,0,20).totalElements()).isGreaterThanOrEqualTo(1);}
 }
}
