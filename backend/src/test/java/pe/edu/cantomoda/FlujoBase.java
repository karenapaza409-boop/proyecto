package pe.edu.cantomoda;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.*;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.context.annotation.Import(TestJwtConfig.class)
abstract class FlujoBase {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
  long categoria, producto, otro, proveedor;

  org.springframework.test.web.servlet.request.RequestPostProcessor usuario(
      String role, String sub) {
    return jwt()
        .jwt(
            j ->
                j.subject(sub)
                    .claim("realm_access", java.util.Map.of("roles", java.util.List.of(role))))
        .authorities(new SimpleGrantedAuthority("ROLE_" + role));
  }

  JsonNode body(MvcResult r) throws Exception {
    return json.readTree(r.getResponse().getContentAsString());
  }

  JsonNode postAdmin(String path, String data, int status) throws Exception {
    return body(
        mvc.perform(
                post("/api/v1" + path)
                    .with(usuario("ADMIN", "admin-test"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(data))
            .andExpect(status().is(status))
            .andReturn());
  }

  @BeforeEach
  void preparar() throws Exception {
    String key = java.util.UUID.randomUUID().toString().substring(0, 8);
    categoria =
        postAdmin("/categorias", "{\"nombre\":\"Test " + key + "\"}", 201).get("id").asLong();
    proveedor =
        postAdmin(
                "/proveedores",
                "{\"nombre\":\"Proveedor test\",\"tipoDocumento\":\"RUC\",\"documento\":\""
                    + String.format("%011d", java.util.concurrent.ThreadLocalRandom.current().nextLong(100000000000L)) + "\"}",
                201)
            .get("id")
            .asLong();
    producto =
        postAdmin(
                "/productos",
                "{\"codigo\":\"A-"
                    + key
                    + "\",\"nombre\":\"Polo test\",\"categoriaId\":"
                    + categoria
                    + ",\"precio\":2.50}",
                201)
            .get("id")
            .asLong();
    otro =
        postAdmin(
                "/productos",
                "{\"codigo\":\"B-"
                    + key
                    + "\",\"nombre\":\"Jean test\",\"categoriaId\":"
                    + categoria
                    + ",\"precio\":4.00}",
                201)
            .get("id")
            .asLong();
  }

  String compra(int cantidad) {
    return "{\"proveedorId\":"
        + proveedor
        + ",\"detalles\":[{\"productoId\":"
        + producto
        + ",\"cantidad\":"
        + cantidad
        + ",\"precioUnitario\":1.20}]}";
  }

  String venta(int cantidad) {
    return "{\"claveOperacion\":\""+java.util.UUID.randomUUID()+"\",\"efectivoRecibido\":999999.99,\"detalles\":[{\"productoId\":" + producto + ",\"precioEsperado\":2.50,\"cantidad\":" + cantidad + "}]}";
  }

  int stock(long id) throws Exception {
    return body(mvc.perform(get("/api/v1/productos/" + id).with(usuario("ADMIN", "admin-test")))
            .andExpect(status().isOk())
            .andReturn())
        .get("stock")
        .asInt();
  }

  long total(String tipo, String actor) throws Exception {
    return body(mvc.perform(get("/api/v1/" + tipo + "/resumen").with(usuario("VENDEDOR", actor)))
            .andExpect(status().isOk())
            .andReturn())
        .get("cantidad")
        .asLong();
  }

  @Test
  void compraVentaConsultaAnulacionYAuditoria() throws Exception {
    postAdmin("/compras", compra(10), 201);
    assertThat(stock(producto)).isEqualTo(10);
    JsonNode v = postAdmin("/ventas", venta(2), 201);
    assertThat(v.get("total").decimalValue()).isEqualByComparingTo("5.00");
    assertThat(v.get("actor").asText()).isEqualTo("admin-test");
    assertThat(stock(producto)).isEqualTo(8);
    mvc.perform(
            patch("/api/v1/ventas/" + v.get("id").asLong() + "/anular")
                .with(usuario("SUPERVISOR", "supervisor-test")))
        .andExpect(status().isOk());
    assertThat(stock(producto)).isEqualTo(10);
    mvc.perform(
            patch("/api/v1/ventas/" + v.get("id").asLong() + "/anular")
                .with(usuario("SUPERVISOR", "supervisor-test")))
        .andExpect(status().isConflict());
    assertThat(stock(producto)).isEqualTo(10);
    var audits =
        body(mvc.perform(
                    get("/api/v1/auditoria")
                        .param("size", "100")
                        .with(usuario("ADMIN", "admin-test")))
                .andExpect(status().isOk())
                .andReturn())
            .get("content");
    boolean crear = false, anular = false;
    for (JsonNode a : audits) {
      if (a.get("entidad").asText().equals("VENTA")
          && a.get("entidadId").asLong() == v.get("id").asLong()) {
        crear |=
            a.get("accion").asText().equals("CREAR")
                && a.get("actor").asText().equals("admin-test");
        anular |=
            a.get("accion").asText().equals("ANULAR")
                && a.get("actor").asText().equals("supervisor-test");
      }
    }
    assertThat(crear && anular).isTrue();
  }

  @Test
  void fallaSegundaLineaRevierteStockCabeceraYDetalle() throws Exception {
    postAdmin("/compras", compra(5), 201);
    String actor = "rollback-" + producto;
    long antes = total("ventas", actor);
    long detallesAntes = jdbc.queryForObject("SELECT COUNT(*) FROM MM_VENTAS.DETALLES_VENTA", Long.class);
    long movimientosAntes = jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.MOVIMIENTOS_STOCK", Long.class);
    long auditoriaAntes = jdbc.queryForObject("SELECT COUNT(*) FROM MM_AUDITORIA.REGISTROS", Long.class);
    mvc.perform(
            post("/api/v1/ventas")
                .with(usuario("VENDEDOR", actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"claveOperacion\":\""+java.util.UUID.randomUUID()+"\",\"efectivoRecibido\":20,\"detalles\":[{\"productoId\":"
                        + producto
                        + ",\"precioEsperado\":2.50,\"cantidad\":2},{\"productoId\":"
                        + otro
                        + ",\"precioEsperado\":4.00,\"cantidad\":1}]}"))
        .andExpect(status().isConflict());
    assertThat(stock(producto)).isEqualTo(5);
    assertThat(stock(otro)).isZero();
    assertThat(total("ventas", actor)).isEqualTo(antes);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.MOVIMIENTOS_STOCK", Long.class)).isEqualTo(movimientosAntes);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_VENTAS.DETALLES_VENTA", Long.class)).isEqualTo(detallesAntes);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_AUDITORIA.REGISTROS", Long.class)).isEqualTo(auditoriaAntes);
  }

  @Test
  void dosVentasConcurrentesNoGeneranStockNegativo() throws Exception {
    postAdmin("/compras", compra(1), 201);
    var start = new java.util.concurrent.CountDownLatch(1);
    try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
      java.util.concurrent.Callable<Integer> vender = () -> {
        if (!start.await(10, java.util.concurrent.TimeUnit.SECONDS)) throw new IllegalStateException("Inicio no recibido");
        return mvc.perform(post("/api/v1/ventas")
            .with(usuario("VENDEDOR", "concurrente-" + producto))
            .contentType(MediaType.APPLICATION_JSON).content(venta(1)))
            .andReturn().getResponse().getStatus();
      };
      var a = pool.submit(vender); var b = pool.submit(vender); start.countDown();
      assertThat(java.util.List.of(a.get(20, java.util.concurrent.TimeUnit.SECONDS), b.get(20, java.util.concurrent.TimeUnit.SECONDS)))
          .containsExactlyInAnyOrder(201, 409);
    }
    assertThat(stock(producto)).isZero();
    assertThat(total("ventas", "concurrente-" + producto)).isEqualTo(1);
  }

  @Test
  void cabeceraNoAceptaDetallesVaciosONulos() throws Exception {
    postAdmin("/ventas", "{\"detalles\":[]}", 400);
    postAdmin("/ventas", "{}", 400);
    postAdmin("/ventas", "{\"detalles\":[null]}", 400);
  }

  @Test
  void movimientosCompraVentaMermaConteoYPermisos() throws Exception {
    postAdmin("/compras",compra(10),201); postAdmin("/ventas",venta(2),201);
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/productos/"+producto+"/ajustes").with(usuario("SUPERVISOR","supervisor-test"))
      .contentType(MediaType.APPLICATION_JSON).content("{\"tipo\":\"MERMA\",\"cantidad\":1,\"stockEsperado\":8,\"motivo\":\"Envase ficticio roto\"}"))
      .andExpect(status().isOk()).andExpect(jsonPath("$.stock").value(7));
    postAdmin("/productos/"+producto+"/ajustes","{\"tipo\":\"CONTEO\",\"cantidad\":6,\"stockEsperado\":7,\"motivo\":\"Conteo ficticio comprobado\"}",200);
    assertThat(stock(producto)).isEqualTo(6);
    var pagina=body(mvc.perform(get("/api/v1/productos/"+producto+"/movimientos").with(usuario("ADMIN","admin-test")))
      .andExpect(status().isOk()).andReturn());
    assertThat(pagina.get("totalElements").asLong()).isEqualTo(4);
    assertThat(pagina.get("content").get(0).get("saldo").asInt()).isEqualTo(6);
    assertThat(pagina.get("content").get(0).get("salida").asInt()).isEqualTo(1);
    postAdmin("/productos/"+producto+"/ajustes","{\"tipo\":\"MERMA\",\"cantidad\":8,\"stockEsperado\":6,\"motivo\":\"Prueba sin stock suficiente\"}",409);
    postAdmin("/productos/"+producto+"/ajustes","{\"tipo\":\"CONTEO\",\"cantidad\":1,\"stockEsperado\":7,\"motivo\":\"Lectura desactualizada ficticia\"}",409);
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/productos/"+producto+"/ajustes").with(usuario("VENDEDOR","test"))
      .contentType(MediaType.APPLICATION_JSON).content("{\"tipo\":\"MERMA\",\"cantidad\":1,\"stockEsperado\":6,\"motivo\":\"Sin permiso\"}"))
      .andExpect(status().isForbidden());
    assertThat(stock(producto)).isEqualTo(6);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.MOVIMIENTOS_STOCK WHERE producto_id=?",Long.class,producto)).isEqualTo(4);
    mvc.perform(get("/api/v1/productos/"+producto+"/movimientos").param("tipo","MERMA").with(usuario("ADMIN","admin-test")))
      .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
  }

  @Test
  void productoGuardaBarrasMinimoYFiltraStockBajo() throws Exception {
    String data="{\"codigo\":\"BAR-"+producto+"\",\"nombre\":\"Producto ficticio\",\"categoriaId\":"+categoria+",\"precio\":2.50,\"codigoBarras\":\"TEST"+producto+"\",\"unidadVenta\":\"UNIDAD\",\"stockMinimo\":6}";
    mvc.perform(put("/api/v1/productos/"+producto).with(usuario("ADMIN","admin-test")).contentType(MediaType.APPLICATION_JSON).content(data))
      .andExpect(status().isOk()).andExpect(jsonPath("$.stockMinimo").value(6));
    postAdmin("/compras",compra(5),201);
    mvc.perform(get("/api/v1/productos").param("q","TEST"+producto).param("estadoStock","BAJO").with(usuario("ADMIN","admin-test")))
      .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    postAdmin("/productos",data.replace("BAR-"+producto,"DUP-"+producto),409);
    assertThat(stock(producto)).isEqualTo(5);
  }

  @Test
  void compraPersisteRecepcionComprobanteYObservacionesYRechazaFechaFutura() throws Exception {
    String base = compra(2);
    String fecha = java.time.LocalDate.now().toString();
    String metadata = ",\"fechaRecepcion\":\"" + fecha + "\",\"tipoComprobante\":\"FACTURA\",\"serie\":\"F001\",\"numero\":\"000125\",\"observaciones\":\"Mercaderia ficticia revisada\"}";
    var c = postAdmin("/compras", base.substring(0, base.length()-1) + metadata, 201);
    mvc.perform(get("/api/v1/compras/" + c.get("id").asLong()).with(usuario("ADMIN", "admin-test")))
      .andExpect(status().isOk()).andExpect(jsonPath("$.fechaRecepcion").value(fecha))
      .andExpect(jsonPath("$.serie").value("F001")).andExpect(jsonPath("$.numero").value("000125"))
      .andExpect(jsonPath("$.observaciones").value("Mercaderia ficticia revisada"));
    int antes = stock(producto);
    postAdmin("/compras", base.substring(0,base.length()-1) + ",\"fechaRecepcion\":\"" + java.time.LocalDate.now().plusDays(1) + "\"}", 400);
    postAdmin("/compras", base.substring(0,base.length()-1) + ",\"tipoComprobante\":\"FACTURA\"}", 400);
    assertThat(stock(producto)).isEqualTo(antes);
  }

  @Test
  void consultaDniSinProveedorPermiteRegistroManual() throws Exception {
    mvc.perform(post("/api/v1/clientes/consulta-dni").with(usuario("ADMIN", "admin-test"))
        .contentType(MediaType.APPLICATION_JSON).content("{\"dni\":\"00000000\"}"))
        .andExpect(status().isServiceUnavailable());
    mvc.perform(post("/api/v1/clientes/consulta-dni").with(usuario("ADMIN", "admin-test"))
        .contentType(MediaType.APPLICATION_JSON).content("{\"dni\":\"abc\"}"))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/v1/clientes/consulta-dni").with(usuario("VENDEDOR", "test"))
        .contentType(MediaType.APPLICATION_JSON).content("{\"dni\":\"00000000\"}"))
        .andExpect(status().isForbidden());
    postAdmin("/clientes", "{\"nombre\":\"Persona ficticia manual\",\"tipoDocumento\":\"DNI\",\"documento\":\"" + String.format("%08d",producto) + "\"}", 201);
  }

  @Test
  void permisosReales401Y403() throws Exception {
    mvc.perform(get("/api/v1/productos")).andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/v1/categorias")
                .with(usuario("VENDEDOR", "cajero"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"No permitido\"}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/compras")
                .with(usuario("VENDEDOR", "cajero"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(compra(2)))
        .andExpect(status().isForbidden());
  }

  @Test
  void vendedorVeSoloSusVentas() throws Exception {
    postAdmin("/compras", compra(10), 201);
    String actor = "vendedor-" + producto;
    var v =
        body(
            mvc.perform(
                    post("/api/v1/ventas")
                        .with(usuario("VENDEDOR", actor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(venta(1)))
                .andExpect(status().isCreated())
                .andReturn());
    assertThat(total("ventas", actor)).isEqualTo(1);
    mvc.perform(
            get("/api/v1/ventas/" + v.get("id").asLong())
                .with(usuario("VENDEDOR", "otro-" + actor)))
        .andExpect(status().isForbidden());
  }

  @Test
  void paginacionNoCambiaAgregado() throws Exception {
    postAdmin("/compras", compra(20), 201);
    String actor = "paginas-" + producto;
    for (int i = 0; i < 3; i++)
      mvc.perform(
              post("/api/v1/ventas")
                  .with(usuario("VENDEDOR", actor))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(venta(1)))
          .andExpect(status().isCreated());
    for (int p = 0; p < 3; p++) {
      var r =
          body(
              mvc.perform(
                      get("/api/v1/ventas")
                          .param("page", "" + p)
                          .param("size", "1")
                          .with(usuario("VENDEDOR", actor)))
                  .andExpect(status().isOk())
                  .andReturn());
      assertThat(r.get("content").size()).isEqualTo(1);
      assertThat(r.get("totalElements").asLong()).isEqualTo(3);
    }
    var a =
        body(
            mvc.perform(get("/api/v1/ventas/resumen").with(usuario("VENDEDOR", actor)))
                .andExpect(status().isOk())
                .andReturn());
    assertThat(a.get("total").decimalValue()).isEqualByComparingTo("7.50");
  }

  @Test
  void compraNoSeAnulaSiYaNoHayStockYNoDejaCambiosParciales() throws Exception {
    var c = postAdmin("/compras", compra(5), 201);
    postAdmin("/ventas", venta(1), 201);
    mvc.perform(
            patch("/api/v1/compras/" + c.get("id").asLong() + "/anular")
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isConflict());
    assertThat(stock(producto)).isEqualTo(4);
    mvc.perform(get("/api/v1/compras/" + c.get("id").asLong()).with(usuario("ADMIN", "admin-test")))
        .andExpect(jsonPath("$.estado").value("REGISTRADA"));
  }

  @Test
  void duplicadosYCantidadesInvalidasSeRechazan() throws Exception {
    postAdmin(
        "/ventas", "{\"detalles\":[{\"productoId\":" + producto + ",\"cantidad\":1.5}]}", 400);
    postAdmin("/ventas", "{\"detalles\":[{\"productoId\":" + producto + ",\"cantidad\":0}]}", 400);
    postAdmin(
        "/ventas",
        "{\"claveOperacion\":\""+java.util.UUID.randomUUID()+"\",\"efectivoRecibido\":20,\"detalles\":[{\"productoId\":"
            + producto
            + ",\"precioEsperado\":2.50,\"cantidad\":1},{\"productoId\":"
            + producto
            + ",\"precioEsperado\":2.50,\"cantidad\":1}]}",
        409);
  }

  @Test
  void filtrosVaciosReporteCeroYOrdenValidado() throws Exception {
    mvc.perform(
            get("/api/v1/ventas/resumen")
                .param("desde", "2000-01-01")
                .param("hasta", "2000-01-02")
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cantidad").value(0))
        .andExpect(jsonPath("$.total").value(0));
    mvc.perform(
            get("/api/v1/ventas")
                .param("ordenarPor", "campoInexistente")
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void categoriaInexistenteYErroresControlados() throws Exception {
    postAdmin(
        "/productos",
        "{\"codigo\":\"BAD\",\"nombre\":\"Prueba\",\"categoriaId\":999999999,\"precio\":2}",
        404);
  }

  @Test
  void corsPermitidoYBloqueado() throws Exception {
    mvc.perform(
            options("/api/v1/productos")
                .header("Origin", "http://localhost:4201")
                .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4201"));
    mvc.perform(
            options("/api/v1/productos")
                .header("Origin", "https://otro.example")
                .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isForbidden());
  }

  @Test
  void cacheSoloLecturaYTraceId() throws Exception {
    mvc.perform(
            get("/api/v1/categorias")
                .with(usuario("ADMIN", "admin-test"))
                .header("X-Trace-ID", "prueba-123"))
        .andExpect(status().isOk())
        .andExpect(
            header().string("Cache-Control", org.hamcrest.Matchers.containsString("private")))
        .andExpect(header().string("X-Trace-ID", "prueba-123"));
  }

  @Test
  void firmaRsaRealYRolesDelToken() throws Exception {
    var key =
        new com.nimbusds.jose.jwk.RSAKey.Builder(
                (java.security.interfaces.RSAPublicKey) TestJwtConfig.KEYS.getPublic())
            .privateKey(TestJwtConfig.KEYS.getPrivate())
            .build();
    var encoder =
        new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(
            new com.nimbusds.jose.jwk.source.ImmutableJWKSet<>(
                new com.nimbusds.jose.jwk.JWKSet(key)));
    var claims =
        org.springframework.security.oauth2.jwt.JwtClaimsSet.builder()
            .subject("rsa-test")
            .issuedAt(java.time.Instant.now())
            .expiresAt(java.time.Instant.now().plusSeconds(300))
            .claim("realm_access", java.util.Map.of("roles", java.util.List.of("VENDEDOR", "COMPRADOR")))
            .build();
    var header =
        org.springframework.security.oauth2.jwt.JwsHeader.with(
                org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256)
            .build();
    String token =
        encoder
            .encode(
                org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(header, claims))
            .getTokenValue();
    mvc.perform(get("/api/v1/productos").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/ventas").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/compras").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());
    mvc.perform(
            post("/api/v1/categorias")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Sin permiso\"}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            get("/api/v1/productos")
                .header(
                    "Authorization",
                    "Bearer " + token.substring(0, token.lastIndexOf('.') + 1) + "firma-invalida"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void compraConProductoExistenteYNuevoRollbackDuplicadosIdempotenciaYPermisos() throws Exception {
    String fecha = java.time.LocalDate.now().toString();
    String clave = java.util.UUID.randomUUID().toString();
    String codigoBarrasNuevo = "775" + String.format("%010d", producto);
    String payload =
        "{\"proveedorId\":"
            + proveedor
            + ",\"fechaRecepcion\":\""
            + fecha
            + "\",\"tipoComprobante\":\"FACTURA\",\"serie\":\"F001\",\"numero\":\"000777\""
            + ",\"claveOperacion\":\""
            + clave
            + "\",\"detalles\":["
            + "{\"productoId\":"
            + producto
            + ",\"cantidad\":24,\"precioUnitario\":5.00},"
            + "{\"cantidad\":12,\"precioUnitario\":4.50,\"nuevoProducto\":{"
            + "\"nombre\":\"Energizante 473 ml\",\"categoriaId\":"
            + categoria
            + ",\"precioVenta\":7.00,\"codigoBarras\":\""
            + codigoBarrasNuevo
            + "\"}}]}";

    JsonNode compraCreada = postAdmin("/compras", payload, 201);
    assertThat(compraCreada.get("total").decimalValue()).isEqualByComparingTo("174.00");
    assertThat(stock(producto)).isEqualTo(24);

    // El precio de venta del producto existente se conserva como referencia sin modificarse
    JsonNode prodExistente =
        body(
            mvc.perform(get("/api/v1/productos/" + producto).with(usuario("ADMIN", "admin-test")))
                .andExpect(status().isOk())
                .andReturn());
    assertThat(prodExistente.get("precio").decimalValue()).isEqualByComparingTo("2.50");

    // El producto nuevo fue creado en la transaccion con unidad UNIDAD, codigo automatico y stock 12
    long nuevoProdId = compraCreada.get("detalles").get(1).get("productoId").asLong();
    JsonNode prodNuevo =
        body(
            mvc.perform(get("/api/v1/productos/" + nuevoProdId).with(usuario("ADMIN", "admin-test")))
                .andExpect(status().isOk())
                .andReturn());
    assertThat(prodNuevo.get("nombre").asText()).isEqualTo("Energizante 473 ml");
    assertThat(prodNuevo.get("unidadVenta").asText()).isEqualTo("UNIDAD");
    assertThat(prodNuevo.get("precio").decimalValue()).isEqualByComparingTo("7.00");
    assertThat(prodNuevo.get("codigoBarras").asText()).isEqualTo(codigoBarrasNuevo);
    assertThat(prodNuevo.get("codigo").asText()).matches("^[A-Z0-9]{3}-\\d{3,}$");
    assertThat(prodNuevo.get("stock").asInt()).isEqualTo(12);

    // Doble envio con la misma claveOperacion devuelve la misma compra sin duplicar stock ni productos
    JsonNode reintento = postAdmin("/compras", payload, 201);
    assertThat(reintento.get("id").asLong()).isEqualTo(compraCreada.get("id").asLong());
    assertThat(stock(producto)).isEqualTo(24);
    assertThat(stock(nuevoProdId)).isEqualTo(12);

    // Reutilizar claveOperacion con distinto contenido se rechaza con 409
    postAdmin("/compras", payload.replace("\"cantidad\":24", "\"cantidad\":10"), 409);

    // Codigo de barras duplicado devuelve 409 con productoExistente y revierte toda la transaccion
    long comprasAntes =
        jdbc.queryForObject("SELECT COUNT(*) FROM MM_COMPRAS.COMPRAS", Long.class);
    long productosAntes =
        jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.PRODUCTOS", Long.class);
    long movsAntes =
        jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.MOVIMIENTOS_STOCK", Long.class);

    String payloadDuplicado =
        "{\"proveedorId\":"
            + proveedor
            + ",\"detalles\":["
            + "{\"productoId\":"
            + producto
            + ",\"cantidad\":5,\"precioUnitario\":2.00},"
            + "{\"cantidad\":3,\"precioUnitario\":1.50,\"nuevoProducto\":{"
            + "\"nombre\":\"Otro valido antes del fallo\",\"categoriaId\":"
            + categoria
            + ",\"precioVenta\":3.00}},"
            + "{\"cantidad\":4,\"precioUnitario\":4.00,\"nuevoProducto\":{"
            + "\"nombre\":\"Duplicado barras\",\"categoriaId\":"
            + categoria
            + ",\"precioVenta\":6.00,\"codigoBarras\":\""
            + codigoBarrasNuevo
            + "\"}}]}";

    JsonNode errDuplicado = postAdmin("/compras", payloadDuplicado, 409);
    assertThat(errDuplicado.get("codigo").asText()).isEqualTo("PRODUCTO_DUPLICADO");
    assertThat(errDuplicado.get("productoExistente").get("id").asLong()).isEqualTo(nuevoProdId);
    assertThat(stock(producto)).isEqualTo(24);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_COMPRAS.COMPRAS", Long.class))
        .isEqualTo(comprasAntes);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.PRODUCTOS", Long.class))
        .isEqualTo(productosAntes);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.MOVIMIENTOS_STOCK", Long.class))
        .isEqualTo(movsAntes);

    // Permisos: COMPRADOR puede registrar compra de productos existentes, pero no crear productos nuevos (403)
    mvc.perform(
            post("/api/v1/compras")
                .with(usuario("COMPRADOR", "comprador-test"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(compra(3)))
        .andExpect(status().isCreated());
    assertThat(stock(producto)).isEqualTo(27);

    String payloadCompradorNuevo =
        "{\"proveedorId\":"
            + proveedor
            + ",\"detalles\":[{\"cantidad\":5,\"precioUnitario\":2.00,\"nuevoProducto\":{"
            + "\"nombre\":\"Intento sin permiso\",\"categoriaId\":"
            + categoria
            + ",\"precioVenta\":3.50}}]}";
    mvc.perform(
            post("/api/v1/compras")
                .with(usuario("COMPRADOR", "comprador-test"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadCompradorNuevo))
        .andExpect(status().isForbidden());
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_CATALOGO.PRODUCTOS", Long.class))
        .isEqualTo(productosAntes);

    // 1. Eliminar un producto que ya fue usado en una compra (`nuevoProdId`) responde 204, desaparece del catálogo activo, pero se conserva en el historial de la compra
    mvc.perform(
            delete("/api/v1/productos/" + nuevoProdId)
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isNoContent());

    mvc.perform(
            get("/api/v1/productos/" + nuevoProdId)
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isNotFound());

    // La compra donde fue usado conserva el producto en su historial
    mvc.perform(
            get("/api/v1/compras/" + compraCreada.get("id").asLong())
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.detalles[1].productoNombre").value("Energizante 473 ml"))
        .andExpect(jsonPath("$.detalles[1].cantidad").value(12));

    // El historial de movimientos también se conserva intacto
    mvc.perform(
            get("/api/v1/productos/" + nuevoProdId + "/movimientos")
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1));

    // El producto eliminado ya no se puede añadir a nuevas compras ni a nuevas ventas
    postAdmin(
        "/compras",
        "{\"proveedorId\":"
            + proveedor
            + ",\"detalles\":[{\"productoId\":"
            + nuevoProdId
            + ",\"cantidad\":2,\"precioUnitario\":4.50}]}",
        409);
    postAdmin(
        "/ventas",
        "{\"claveOperacion\":\""
            + java.util.UUID.randomUUID()
            + "\",\"efectivoRecibido\":50.00,\"detalles\":[{\"productoId\":"
            + nuevoProdId
            + ",\"precioEsperado\":7.00,\"cantidad\":1}]}",
        409);

    // 2. Producto sin operaciones (`otro`) también se elimina normalmente respetando permisos
    mvc.perform(
            delete("/api/v1/productos/" + otro)
                .with(usuario("VENDEDOR", "vendedor-test")))
        .andExpect(status().isForbidden());
    mvc.perform(
            delete("/api/v1/productos/" + otro)
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isNoContent());
    mvc.perform(
            get("/api/v1/productos/" + otro)
                .with(usuario("ADMIN", "admin-test")))
        .andExpect(status().isNotFound());
  }
}
