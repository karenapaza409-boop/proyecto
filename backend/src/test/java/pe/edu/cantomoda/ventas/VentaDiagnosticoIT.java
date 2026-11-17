package pe.edu.cantomoda.ventas;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.edu.cantomoda.TestJwtConfig;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("oracle-it")
@Import(TestJwtConfig.class)
public class VentaDiagnosticoIT {

  @Autowired
  private MockMvc mvc;

  @Autowired
  private JdbcTemplate jdbc;

  @Test
  void testVentaConsumidorFinalConUnSoloDescuentoDeStock() throws Exception {
    Long productoId = 3L; // Jean azul clasico - Talla 32
    Integer stockInicial = jdbc.queryForObject(
        "SELECT stock FROM MM_CATALOGO.PRODUCTOS WHERE id = ?", Integer.class, productoId);
    assertThat(stockInicial).isNotNull().isGreaterThan(0);

    Long totalVentasAntes = jdbc.queryForObject(
        "SELECT COUNT(*) FROM MM_VENTAS.VENTAS", Long.class);

    String clave = UUID.randomUUID().toString();
    String payload = """
        {
          "clienteId": null,
          "clienteDocumento": null,
          "clienteTipoDocumento": "DNI",
          "clienteNombre": null,
          "claveOperacion": "%s",
          "efectivoRecibido": 10.00,
          "detalles": [
            {"productoId": %d, "cantidad": 1, "precioEsperado": 4.50}
          ]
        }
        """.formatted(clave, productoId);

    var result = mvc.perform(post("/api/v1/ventas")
            .with(jwt().jwt(j -> j.subject("cajero-cf-uuid").claim("name", "Cajero CF"))
                .authorities(new SimpleGrantedAuthority("ROLE_VENDEDOR")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.cliente").value("Consumidor final"))
        .andExpect(jsonPath("$.clienteId").isEmpty())
        .andExpect(jsonPath("$.total").value(4.50))
        .andExpect(jsonPath("$.vuelto").value(5.50))
        .andReturn();

    // 1. Verifica que se registró UNA sola venta
    Long totalVentasDespues = jdbc.queryForObject(
        "SELECT COUNT(*) FROM MM_VENTAS.VENTAS", Long.class);
    assertThat(totalVentasDespues).isEqualTo(totalVentasAntes + 1);

    // 2. Verifica que el stock descontó exactamente 1 unidad
    Integer stockFinal = jdbc.queryForObject(
        "SELECT stock FROM MM_CATALOGO.PRODUCTOS WHERE id = ?", Integer.class, productoId);
    assertThat(stockFinal).isEqualTo(stockInicial - 1);
  }

  @Test
  void testVentaClienteExistenteSinDuplicadosNiErrores() throws Exception {
    Long productoId = 4L; // Pantalon jogger gris - Talla M
    Integer stockInicial = jdbc.queryForObject(
        "SELECT stock FROM MM_CATALOGO.PRODUCTOS WHERE id = ?", Integer.class, productoId);
    assertThat(stockInicial).isNotNull().isGreaterThan(0);

    Long totalVentasAntes = jdbc.queryForObject(
        "SELECT COUNT(*) FROM MM_VENTAS.VENTAS", Long.class);
    Long totalClientesAntes = jdbc.queryForObject(
        "SELECT COUNT(*) FROM MM_VENTAS.CLIENTES", Long.class);

    String clave = UUID.randomUUID().toString();
    String payload = """
        {
          "clienteId": null,
          "clienteDocumento": "73231090",
          "clienteTipoDocumento": "DNI",
          "clienteNombre": "Brayan Roy Estofanero",
          "claveOperacion": "%s",
          "efectivoRecibido": 5.00,
          "detalles": [
            {"productoId": %d, "cantidad": 1, "precioEsperado": 1.50}
          ]
        }
        """.formatted(clave, productoId);

    var result = mvc.perform(post("/api/v1/ventas")
            .with(jwt().jwt(j -> j.subject("cajero-cli-uuid").claim("name", "Cajero CLI"))
                .authorities(new SimpleGrantedAuthority("ROLE_VENDEDOR")))
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.clienteId").value(1020))
        .andExpect(jsonPath("$.total").value(1.50))
        .andExpect(jsonPath("$.vuelto").value(3.50))
        .andReturn();

    // 1. No se crearon nuevos clientes duplicados
    Long totalClientesDespues = jdbc.queryForObject(
        "SELECT COUNT(*) FROM MM_VENTAS.CLIENTES", Long.class);
    assertThat(totalClientesDespues).isEqualTo(totalClientesAntes);

    // 2. Se registró UNA sola venta
    Long totalVentasDespues = jdbc.queryForObject(
        "SELECT COUNT(*) FROM MM_VENTAS.VENTAS", Long.class);
    assertThat(totalVentasDespues).isEqualTo(totalVentasAntes + 1);

    // 3. Se descontó exactamente 1 unidad de stock
    Integer stockFinal = jdbc.queryForObject(
        "SELECT stock FROM MM_CATALOGO.PRODUCTOS WHERE id = ?", Integer.class, productoId);
    assertThat(stockFinal).isEqualTo(stockInicial - 1);
  }
}
