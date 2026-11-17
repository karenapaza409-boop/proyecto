package pe.edu.cantomoda;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import pe.edu.cantomoda.catalogo.service.ProductoService;
import static org.assertj.core.api.Assertions.*;
/** Solo lectura: no inserta productos, ajustes ni operaciones en la base real. */
@SpringBootTest @ActiveProfiles("oracle-it")
class InventarioOracleLecturaIT {
 @Autowired ProductoService productos; @Autowired JdbcTemplate jdbc;
 @Test void consultaYConciliacionDeSaldos() {
   var page=productos.listar(null,null,null,0,20);
   for(var p:page.content()) productos.movimientos(p.id(),null,null,null,0,20);
   Long diferencias=jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.PRODUCTOS p WHERE p.stock <> (SELECT m.saldo FROM MM_CATALOGO.MOVIMIENTOS_STOCK m WHERE m.producto_id=p.id ORDER BY m.id DESC FETCH FIRST 1 ROWS ONLY)",Long.class);
   assertThat(diferencias).isZero();
 }
}
