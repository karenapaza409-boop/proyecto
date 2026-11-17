package pe.edu.cantomoda;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.context.annotation.Import(TestJwtConfig.class)
class ProveedorIntegracionTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired JdbcTemplate jdbc;
  String documento() { return String.format("%08d", java.util.concurrent.ThreadLocalRandom.current().nextInt(100000000)); }
  org.springframework.test.web.servlet.request.RequestPostProcessor user(String role, String sub) {
    return jwt().jwt(j -> j.subject(sub)).authorities(new SimpleGrantedAuthority("ROLE_" + role));
  }
  String payload(String documento, String nombre) throws Exception {
    return json.writeValueAsString(Map.of("nombre", nombre, "documento", documento, "tipoDocumento", "DNI"));
  }
  JsonNode body(MvcResult r) throws Exception { return json.readTree(r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)); }
  JsonNode post(String path, String data) throws Exception {
    return body(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1" + path)
      .with(user("ADMIN", "proveedor-admin-test")).contentType(MediaType.APPLICATION_JSON).content(data))
      .andExpect(status().isCreated()).andReturn());
  }
  JsonNode proveedor() throws Exception { return post("/proveedores", payload(documento(), "Proveedor ficticio " + UUID.randomUUID())); }
  JsonNode getAdmin(String path) throws Exception {
    return body(mvc.perform(get("/api/v1" + path).with(user("ADMIN", "proveedor-admin-test"))).andExpect(status().isOk()).andReturn());
  }
  void estado(long id, boolean activo) throws Exception {
    mvc.perform(put("/api/v1/proveedores/" + id + "/estado").with(user("ADMIN", "proveedor-admin-test"))
      .contentType(MediaType.APPLICATION_JSON).content("{\"activo\":" + activo + "}"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.activo").value(activo));
  }
  String compra(long proveedor) throws Exception {
    String key = UUID.randomUUID().toString();
    long categoria = post("/categorias", json.writeValueAsString(Map.of("nombre", "Categoría proveedor " + key))).get("id").asLong();
    long producto = post("/productos", json.writeValueAsString(Map.of("codigo", key, "nombre", "Producto ficticio", "categoriaId", categoria, "precio", 2))).get("id").asLong();
    return json.writeValueAsString(Map.of("proveedorId", proveedor, "detalles", List.of(Map.of("productoId", producto, "cantidad", 2, "precioUnitario", 1.25))));
  }

  @Test void creaConContactoOpcionalEditaYAudiTaCambios() throws Exception {
    var p = proveedor(); long id = p.get("id").asLong();
    assertThat(p.get("activo").asBoolean()).isTrue();
    assertThat(p.get("correo").isNull()).isTrue();
    var data = new LinkedHashMap<String,Object>();
    data.put("nombre", "  Distribuidora ficticia editada  "); data.put("documento", p.get("documento").asText()); data.put("tipoDocumento", "DNI");
    data.put("nombreComercial", "Comercial ficticio"); data.put("personaContacto", "Persona de prueba"); data.put("telefono", "+51 999 000 000");
    data.put("correo", "prueba@example.test"); data.put("direccion", "Dirección de prueba 123");
    mvc.perform(put("/api/v1/proveedores/" + id).with(user("ADMIN", "proveedor-admin-test"))
      .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data)))
      .andExpect(status().isOk()).andExpect(jsonPath("$.nombre").value("Distribuidora ficticia editada"))
      .andExpect(jsonPath("$.nombreComercial").value("Comercial ficticio"));
    var saved = getAdmin("/proveedores/" + id);
    assertThat(saved.get("correo").asText()).isEqualTo("prueba@example.test");
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_AUDITORIA.REGISTROS WHERE entidad='PROVEEDOR' AND entidad_id=? AND actor=?", Long.class, id, "proveedor-admin-test")).isEqualTo(2);
    assertThat(jdbc.queryForObject("SELECT detalle FROM MM_AUDITORIA.REGISTROS WHERE entidad='PROVEEDOR' AND entidad_id=? AND accion='ACTUALIZAR'", String.class, id))
      .contains("correo", "telefono").doesNotContain("prueba@example.test");
  }

  @Test void rechazaDuplicadoAlCrearYEditarInclusoInactivo() throws Exception {
    var p = proveedor(); long id = p.get("id").asLong(); estado(id, false);
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/proveedores").with(user("ADMIN", "test"))
      .contentType(MediaType.APPLICATION_JSON).content(payload(" " + p.get("documento").asText() + " ", "Duplicado ficticio")))
      .andExpect(status().isConflict()).andExpect(jsonPath("$.duplicadoId").value(id)).andExpect(jsonPath("$.errors.documento").exists());
    var otro = proveedor();
    mvc.perform(put("/api/v1/proveedores/" + otro.get("id").asLong()).with(user("ADMIN", "test"))
      .contentType(MediaType.APPLICATION_JSON).content(payload(p.get("documento").asText(), "Otro")))
      .andExpect(status().isConflict());
    assertThat(getAdmin("/proveedores/" + otro.get("id").asLong()).get("documento").asText()).isEqualTo(otro.get("documento").asText());
  }

  @Test void baseDeDatosProtegeDuplicados() throws Exception {
    var p = proveedor();
    assertThatThrownBy(() -> jdbc.update("INSERT INTO MM_COMPRAS.PROVEEDORES(nombre,documento,tipo_documento,activo) VALUES (?,?,?,1)",
      "Duplicado directo ficticio", p.get("documento").asText(), "DNI"))
      .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
  }

  @Test void validaCamposYPermisos() throws Exception {
    mvc.perform(get("/api/v1/proveedores/buscar")).andExpect(status().isUnauthorized());
    for (String role : List.of("SUPERVISOR", "COMPRADOR", "VENDEDOR")) {
      mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/proveedores").with(user(role, "test"))
        .contentType(MediaType.APPLICATION_JSON).content(payload(documento(), "Sin permiso"))).andExpect(status().isForbidden());
    }
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/proveedores").with(user("ADMIN", "test"))
      .contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"Proveedor ficticio\",\"tipoDocumento\":\"RUC\",\"documento\":\"123\",\"correo\":\"incorrecto\",\"telefono\":\"abc\"}"))
      .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.documento").exists())
      .andExpect(jsonPath("$.errors.correo").exists()).andExpect(jsonPath("$.errors.telefono").exists());
    var p = proveedor();
    mvc.perform(put("/api/v1/proveedores/" + p.get("id").asLong() + "/estado").with(user("COMPRADOR", "test"))
      .contentType(MediaType.APPLICATION_JSON).content("{\"activo\":false}")).andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/proveedores/" + p.get("id").asLong() + "/historial").with(user("VENDEDOR", "test")))
      .andExpect(status().isForbidden());
  }

  @Test void conservaLegacySinInventarTipoYPermiteClasificarManual() throws Exception {
    String doc = documento();
    jdbc.update("INSERT INTO MM_COMPRAS.PROVEEDORES(nombre,documento,activo) VALUES (?,?,1)", "Proveedor anterior ficticio", doc);
    long id = jdbc.queryForObject("SELECT id FROM MM_COMPRAS.PROVEEDORES WHERE documento=?", Long.class, doc);
    assertThat(getAdmin("/proveedores/" + id).get("tipoDocumento").isNull()).isTrue();
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/proveedores").with(user("ADMIN", "test"))
      .contentType(MediaType.APPLICATION_JSON).content(payload(doc, "Duplicado"))).andExpect(status().isConflict());
    mvc.perform(put("/api/v1/proveedores/" + id).with(user("ADMIN", "test"))
      .contentType(MediaType.APPLICATION_JSON).content(payload(doc, "Clasificado manualmente"))).andExpect(status().isOk());
    assertThat(getAdmin("/proveedores/" + id).get("tipoDocumento").asText()).isEqualTo("DNI");
  }

  @Test void buscaPorIdentificacionYComercialConEstadoYPaginacion() throws Exception {
    var p = proveedor(); long id = p.get("id").asLong(); String key = "Marca-" + UUID.randomUUID();
    var values = new LinkedHashMap<String,Object>(); values.put("nombre", p.get("nombre").asText()); values.put("tipoDocumento", "DNI");
    values.put("documento", p.get("documento").asText()); values.put("nombreComercial", key);
    mvc.perform(put("/api/v1/proveedores/" + id).with(user("ADMIN", "test")).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(values))).andExpect(status().isOk());
    for (String q : List.of(key, p.get("nombre").asText(), p.get("documento").asText())) {
      mvc.perform(get("/api/v1/proveedores/buscar").param("q", q).param("size", "1").param("activo", "true").with(user("COMPRADOR", "test")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].id").value(id));
    }
    estado(id, false);
    mvc.perform(get("/api/v1/proveedores/buscar").param("q", key).param("activo", "true").with(user("ADMIN", "test")))
      .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    mvc.perform(get("/api/v1/proveedores/buscar").param("q", key).param("activo", "false").with(user("ADMIN", "test")))
      .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].activo").value(false));
  }

  @Test void listadoInicialSinFiltrosMuestraProveedorRecienRegistrado() throws Exception {
    var p = proveedor();
    String nombre = p.get("nombre").asText();
    mvc.perform(get("/api/v1/proveedores/buscar").param("page", "0").param("size", "100")
        .with(user("ADMIN", "proveedor-admin-test")))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/proveedores/buscar").param("q", nombre)
        .with(user("ADMIN", "proveedor-admin-test")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    mvc.perform(get("/api/v1/proveedores/buscar").param("activo", "true")
        .with(user("ADMIN", "proveedor-admin-test")))
        .andExpect(status().isOk());
  }

  @Test void desactivarConservaHistorialYBloqueaNuevaCompraHastaReactivar() throws Exception {
    long id = proveedor().get("id").asLong(); String data = compra(id);
    var c = post("/compras", data); estado(id, false);
    var h = getAdmin("/proveedores/" + id + "/historial?size=1");
    assertThat(h.get("compras").get("totalElements").asLong()).isEqualTo(1);
    assertThat(h.get("ultimaCompra").asText()).isEqualTo(getAdmin("/compras/" + c.get("id").asLong()).get("fecha").asText());
    assertThat(getAdmin("/compras/" + c.get("id").asLong()).get("proveedorId").asLong()).isEqualTo(id);
    long antes = jdbc.queryForObject("SELECT COUNT(*) FROM MM_COMPRAS.COMPRAS", Long.class);
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/compras").with(user("ADMIN", "test"))
      .contentType(MediaType.APPLICATION_JSON).content(data)).andExpect(status().isConflict());
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_COMPRAS.COMPRAS", Long.class)).isEqualTo(antes);
    estado(id, true); post("/compras", data);
    assertThat(getAdmin("/proveedores/" + id + "/historial?size=1").get("compras").get("totalElements").asLong()).isEqualTo(2);
  }

  @Test void historialRespetaPropietarioYUltimaCompraNoDependeDePagina() throws Exception {
    long id = proveedor().get("id").asLong(); String data = compra(id);
    post("/compras", data);
    var c = body(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/compras").with(user("COMPRADOR", "comprador-proveedor-test"))
      .contentType(MediaType.APPLICATION_JSON).content(data)).andExpect(status().isCreated()).andReturn());
    mvc.perform(get("/api/v1/proveedores/" + id + "/historial").param("page", "1").param("size", "1").with(user("COMPRADOR", "comprador-proveedor-test")))
      .andExpect(status().isOk()).andExpect(jsonPath("$.compras.totalElements").value(1))
      .andExpect(jsonPath("$.compras.content.length()").value(0)).andExpect(jsonPath("$.ultimaCompra").value(getAdmin("/compras/" + c.get("id").asLong()).get("fecha").asText()));
    assertThat(getAdmin("/proveedores/" + id + "/historial?size=1").get("compras").get("totalElements").asLong()).isEqualTo(2);
  }
}
