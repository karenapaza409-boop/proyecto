package pe.edu.cantomoda.ventas;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.catalogo.dto.ProductoResponse;
import pe.edu.cantomoda.catalogo.service.ProductoService;
import pe.edu.cantomoda.common.exception.BusinessException;
import pe.edu.cantomoda.ventas.dto.LineaVentaRequest;
import pe.edu.cantomoda.ventas.dto.VentaRequest;
import pe.edu.cantomoda.ventas.dto.VentaResponse;
import pe.edu.cantomoda.ventas.entity.Cliente;
import pe.edu.cantomoda.ventas.entity.Venta;
import pe.edu.cantomoda.ventas.exception.ClienteInactivoException;
import pe.edu.cantomoda.ventas.mapper.VentaMapper;
import pe.edu.cantomoda.ventas.repository.VentaRepository;
import pe.edu.cantomoda.ventas.service.ClienteService;
import pe.edu.cantomoda.ventas.service.VentaExcelService;
import pe.edu.cantomoda.ventas.service.VentaService;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

public class VentaServiceTest {

  private Map<String, Venta> ventasPorClave;
  private Map<Long, Venta> ventasPorId;
  private VentaRepository ventaRepo;
  private FakeClienteService clienteService;
  private FakeProductoService productoService;
  private FakeAuditoriaService auditoria;
  private VentaService ventaService;

  static class FakeClienteService extends ClienteService {
    Cliente clienteDevuelto;
    RuntimeException exceptionALanzar;
    String ultimoTipo;
    String ultimoDoc;
    String ultimoNombre;
    String ultimoActor;

    public FakeClienteService() {
      super(null, null, null);
    }

    @Override
    public Cliente resolverOCrear(String tipo, String documento, String nombre, String actor) {
      this.ultimoTipo = tipo;
      this.ultimoDoc = documento;
      this.ultimoNombre = nombre;
      this.ultimoActor = actor;
      if (exceptionALanzar != null) throw exceptionALanzar;
      return clienteDevuelto;
    }
  }

  static class FakeProductoService extends ProductoService {
    final AtomicInteger moverStockLlamadas = new AtomicInteger(0);

    public FakeProductoService() {
      super(null, null, null, null, null);
    }

    @Override
    public ProductoResponse moverStock(Long id, int delta, String actor, String operacion, String referencia, String motivo) {
      moverStockLlamadas.incrementAndGet();
      return new ProductoResponse(id, "P01", "Jean azul talla 32", null, new BigDecimal("4.50"), 10, null, "UNIDAD", 2, true);
    }
  }

  static class FakeAuditoriaService extends AuditoriaService {
    public FakeAuditoriaService() {
      super(null);
    }

    @Override
    public void registrar(String usuario, String accion, String entidad, Long entidadId, String detalle) {
      // no-op para tests
    }
  }

  @BeforeEach
  void setUp() {
    ventasPorClave = new HashMap<>();
    ventasPorId = new HashMap<>();

    ventaRepo = (VentaRepository) Proxy.newProxyInstance(
        VentaRepository.class.getClassLoader(),
        new Class<?>[]{VentaRepository.class},
        (proxy, method, args) -> {
          if ("findByClaveOperacion".equals(method.getName())) {
            String clave = (String) args[0];
            return Optional.ofNullable(ventasPorClave.get(clave));
          }
          if ("saveAndFlush".equals(method.getName())) {
            Venta v = (Venta) args[0];
            if (v.getId() == null) {
              v.setId(1001L);
            }
            if (v.getClaveOperacion() != null) {
              ventasPorClave.put(v.getClaveOperacion(), v);
            }
            ventasPorId.put(v.getId(), v);
            return v;
          }
          if ("findById".equals(method.getName())) {
            Long id = (Long) args[0];
            return Optional.ofNullable(ventasPorId.get(id));
          }
          return null;
        }
    );

    clienteService = new FakeClienteService();
    productoService = new FakeProductoService();
    auditoria = new FakeAuditoriaService();
    VentaMapper mapper = new VentaMapper();
    VentaExcelService excelService = new VentaExcelService();

    ventaService = new VentaService(
        ventaRepo,
        clienteService,
        productoService,
        mapper,
        auditoria,
        excelService
    );
  }

  @Test
  void creaVentaConClienteResueltoPorDocumento() {
    Cliente cliente = new Cliente();
    cliente.setId(50L);
    cliente.setDocumento("73231090");
    cliente.setNombre("Brayan Roy Estofanero");
    cliente.setActivo(true);

    clienteService.clienteDevuelto = cliente;

    VentaRequest req = new VentaRequest(
        null, // clienteId es null, se resuelve por documento
        List.of(new LineaVentaRequest(1L, 2, new BigDecimal("4.50"))),
        UUID.randomUUID().toString(),
        new BigDecimal("10.00"),
        "DNI",
        "73231090",
        "Brayan Roy Estofanero"
    );

    VentaResponse resp = ventaService.crear(req, "cajero1", "Caja Principal");
    assertNotNull(resp);
    assertEquals(1001L, resp.id());
    assertEquals("Brayan Roy Estofanero", resp.cliente());
    assertEquals(new BigDecimal("9.00"), resp.total());
    assertEquals(new BigDecimal("10.00"), resp.efectivoRecibido());
    assertEquals(new BigDecimal("1.00"), resp.vuelto());

    assertEquals("DNI", clienteService.ultimoTipo);
    assertEquals("73231090", clienteService.ultimoDoc);
    assertEquals("Brayan Roy Estofanero", clienteService.ultimoNombre);
    assertEquals("cajero1", clienteService.ultimoActor);
    assertEquals(1, productoService.moverStockLlamadas.get());
  }

  @Test
  void rechazaVentaSiClienteEstaInactivo() {
    clienteService.exceptionALanzar = new ClienteInactivoException(99L, "Inactivo", "44556677");

    VentaRequest req = new VentaRequest(
        null,
        List.of(new LineaVentaRequest(1L, 1, new BigDecimal("4.50"))),
        UUID.randomUUID().toString(),
        new BigDecimal("10.00"),
        "DNI",
        "44556677",
        "Inactivo"
    );

    assertThrows(ClienteInactivoException.class, () -> {
      ventaService.crear(req, "cajero1", "Caja");
    });
    // No debe descontar stock si el cliente está inactivo
    assertEquals(0, productoService.moverStockLlamadas.get());
  }

  @Test
  void rechazaVentaSiEfectivoEsInsuficiente() {
    VentaRequest req = new VentaRequest(
        null,
        List.of(new LineaVentaRequest(1L, 1, new BigDecimal("10.00"))),
        UUID.randomUUID().toString(),
        new BigDecimal("5.00"), // Menor que total (10.00)
        null,
        null,
        null
    );

    // Como precio unitario devuelto por FakeProductoService es 4.50, para que total > 5.00 usamos cantidad 2 (total 9.00 > 5.00)
    VentaRequest reqInsuficiente = new VentaRequest(
        null,
        List.of(new LineaVentaRequest(1L, 2, new BigDecimal("4.50"))),
        UUID.randomUUID().toString(),
        new BigDecimal("5.00"), // Total es 9.00, insuficiente
        null,
        null,
        null
    );

    assertThrows(BusinessException.class, () -> {
      ventaService.crear(reqInsuficiente, "cajero1", "Caja");
    });
  }

  @Test
  void esIdempotentePorClaveOperacion() {
    Venta ventaExistente = new Venta();
    ventaExistente.setId(2002L);
    ventaExistente.setActor("cajero1");
    ventaExistente.setTotal(new BigDecimal("5.00"));
    ventaExistente.setFecha(java.time.LocalDateTime.now());
    ventaExistente.setEstado("REGISTRADA");

    String clave = UUID.randomUUID().toString();
    VentaRequest req = new VentaRequest(
        null,
        List.of(new LineaVentaRequest(1L, 1, new BigDecimal("5.00"))),
        clave,
        new BigDecimal("5.00")
    );

    ventaExistente.setHuellaSolicitud(calcularHuella(req));
    ventasPorClave.put(clave, ventaExistente);

    VentaResponse resp = ventaService.crear(req, "cajero1", "Caja");
    assertEquals(2002L, resp.id());
    // No vuelve a descontar stock
    assertEquals(0, productoService.moverStockLlamadas.get());
  }

  private String calcularHuella(VentaRequest r) {
    StringBuilder s = new StringBuilder()
        .append(r.clienteId())
        .append(':')
        .append(r.clienteDocumento() != null ? r.clienteDocumento().trim() : "")
        .append('|')
        .append(r.efectivoRecibido().setScale(2));
    r.detalles().stream().sorted(Comparator.comparing(LineaVentaRequest::productoId))
        .forEach(d -> s.append('|').append(d.productoId()).append(':').append(d.cantidad()).append(':').append(d.precioEsperado().setScale(2)));
    try {
      return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
          .digest(s.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
