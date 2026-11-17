package pe.edu.cantomoda;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import pe.edu.cantomoda.compras.service.ProveedorService;

/** Diagnóstico de solo lectura: no prepara fixtures, no modifica proveedores ni ejecuta DDL. */
@SpringBootTest
@ActiveProfiles("oracle-it")
class ProveedorOracleLecturaIT {
  @Autowired ProveedorService proveedores;
  @Test void listadoSinFiltrosEnOracle() {
    proveedores.buscar(null, null, 0, 20);
  }
}
