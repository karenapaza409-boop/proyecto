package pe.edu.cantomoda.compras.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.catalogo.service.ProductoService;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.common.exception.*;
import pe.edu.cantomoda.compras.dto.*;
import pe.edu.cantomoda.compras.entity.*;
import pe.edu.cantomoda.compras.mapper.CompraMapper;
import pe.edu.cantomoda.compras.repository.CompraRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompraService {
  private final CompraRepository repository;
  private final ProveedorService parties;
  private final ProductoService productos;
  private final CompraMapper mapper;
  private final AuditoriaService auditoria;

  private record ClaveRegistro(Long compraId, String actor, String huella) {}

  private record LineaResuelta(Long productoId, Integer cantidad, BigDecimal precioUnitario) {}

  private final Map<String, ClaveRegistro> clavesOperacion = new ConcurrentHashMap<>();

  public ProveedorHistorial historialProveedor(Long proveedor, String actor, int page, int size) {
    parties.obtener(proveedor);
    return new ProveedorHistorial(
        PageResponse.of(
            repository
                .historialProveedor(
                    proveedor,
                    actor,
                    PageRequest.of(
                        Math.max(0, page),
                        Math.clamp(size, 1, 100),
                        Sort.by(Sort.Direction.DESC, "fecha", "id")))
                .map(mapper::response)),
        repository.ultimaCompraProveedor(proveedor, actor));
  }

  private void validar(String estado, LocalDate desde, LocalDate hasta) {
    if (desde != null && hasta != null && desde.isAfter(hasta))
      throw new IllegalArgumentException("Rango inválido");
    if (estado != null && !Set.of("REGISTRADA", "ANULADA").contains(estado))
      throw new IllegalArgumentException("Estado inválido");
  }

  public PageResponse<CompraResponse> listar(
      String estado,
      LocalDate desde,
      LocalDate hasta,
      String actor,
      int page,
      int size,
      String ordenarPor,
      String direccion) {
    validar(estado, desde, hasta);
    if (!Set.of("id", "fecha", "total").contains(ordenarPor))
      throw new IllegalArgumentException("Orden inválido");
    return PageResponse.of(
        repository
            .buscar(
                estado,
                desde == null ? null : desde.atStartOfDay(),
                hasta == null ? null : hasta.plusDays(1).atStartOfDay(),
                actor,
                PageRequest.of(
                    Math.max(0, page),
                    Math.clamp(size, 1, 100),
                    Sort.by(Sort.Direction.fromString(direccion), ordenarPor).and(Sort.by("id"))))
            .map(mapper::response));
  }

  public CompraAgregado resumen(String estado, LocalDate desde, LocalDate hasta, String actor) {
    validar(estado, desde, hasta);
    return repository.agregado(
        estado,
        desde == null ? null : desde.atStartOfDay(),
        hasta == null ? null : hasta.plusDays(1).atStartOfDay(),
        actor);
  }

  public CompraResponse obtener(Long id, String actor) {
    Compra v =
        repository.findById(id).orElseThrow(() -> new NotFoundException("Compra no encontrada"));
    if (actor != null && !v.getActor().equals(actor))
      throw new AccessDeniedException("Operación de otro usuario");
    return mapper.response(v);
  }

  @Transactional
  public CompraResponse crear(CompraRequest request, String actor) {
    String clave = limpiar(request.claveOperacion());
    String huella = clave == null ? null : huella(request);
    if (clave != null) {
      ClaveRegistro previo = clavesOperacion.get(clave);
      if (previo != null) {
        if (!Objects.equals(previo.actor(), actor) || !Objects.equals(previo.huella(), huella)) {
          throw new BusinessException(
              "La clave de confirmación ya fue utilizada con otros datos. Revise la operación anterior.");
        }
        var existente = repository.findById(previo.compraId());
        if (existente.isPresent()) {
          return mapper.response(existente.get());
        }
      }
    }

    if (request.detalles() == null || request.detalles().isEmpty())
      throw new BusinessException("Agregue al menos un producto");

    var existentesIds =
        request.detalles().stream()
            .filter(d -> !d.esNuevo())
            .map(LineaCompraRequest::productoId)
            .toList();
    if (existentesIds.stream().distinct().count() != existentesIds.size())
      throw new BusinessException("No repita productos");

    var nuevos = request.detalles().stream().filter(LineaCompraRequest::esNuevo).toList();
    if (!nuevos.isEmpty()) {
      if (!tienePermisoCrearProducto()) {
        throw new AccessDeniedException(
            "No tiene permisos para crear productos nuevos desde compras");
      }
      validarNuevosSinDuplicadosInternos(nuevos);
    }

    Compra v = new Compra();
    v.setProveedor(parties.paraCompra(request.proveedorId()));
    v.setActor(actor);
    v.setFecha(LocalDateTime.now());
    v.setFechaRecepcion(request.fechaRecepcion());
    v.setTipoComprobante(limpiar(request.tipoComprobante()));
    v.setSerie(limpiar(request.serie()));
    v.setNumero(limpiar(request.numero()));
    v.setObservaciones(limpiar(request.observaciones()));
    v.setEstado("REGISTRADA");
    BigDecimal total = BigDecimal.ZERO;
    v.setTotal(BigDecimal.ZERO);
    repository.saveAndFlush(v);

    List<LineaResuelta> lineasResueltas = new ArrayList<>(request.detalles().size());
    for (LineaCompraRequest item : request.detalles()) {
      if (item.esNuevo()) {
        var creado =
            productos.crearDesdeCompra(item.nuevoProducto(), actor, "C-" + v.getId());
        lineasResueltas.add(
            new LineaResuelta(creado.id(), item.cantidad(), item.precioUnitario()));
      } else {
        lineasResueltas.add(
            new LineaResuelta(item.productoId(), item.cantidad(), item.precioUnitario()));
      }
    }

    for (LineaResuelta item :
        lineasResueltas.stream()
            .sorted(Comparator.comparing(LineaResuelta::productoId))
            .toList()) {
      var p =
          productos.moverStock(
              item.productoId(),
              item.cantidad(),
              actor,
              "COMPRA",
              "C-" + v.getId(),
              "Mercadería recibida");
      DetalleCompra d = new DetalleCompra();
      d.setProductoId(p.id());
      d.setProductoNombre(p.nombre());
      d.setCantidad(item.cantidad());
      d.setPrecioUnitario(item.precioUnitario().setScale(2, RoundingMode.HALF_UP));
      d.setSubtotal(d.getPrecioUnitario().multiply(BigDecimal.valueOf(item.cantidad())));
      v.agregar(d);
      total = total.add(d.getSubtotal());
    }
    v.setTotal(total);
    repository.saveAndFlush(v);
    auditoria.registrar(
        actor, "CREAR", "COMPRA", v.getId(), "estado=REGISTRADA; total=" + total);

    if (clave != null) {
      clavesOperacion.put(clave, new ClaveRegistro(v.getId(), actor, huella));
    }
    return mapper.response(v);
  }

  private boolean tienePermisoCrearProducto() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) return false;
    return auth.getAuthorities().stream()
        .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
  }

  private void validarNuevosSinDuplicadosInternos(List<LineaCompraRequest> nuevos) {
    Set<String> codigos = new HashSet<>();
    Set<String> barras = new HashSet<>();
    for (LineaCompraRequest item : nuevos) {
      var n = item.nuevoProducto();
      String cod = limpiar(n.codigo());
      if (cod != null && !codigos.add(cod.toUpperCase(Locale.ROOT))) {
        throw new BusinessException("No repita el código interno '" + cod + "' en la misma compra");
      }
      String bar = limpiar(n.codigoBarras());
      if (bar != null && !barras.add(bar.toUpperCase(Locale.ROOT))) {
        throw new BusinessException(
            "No repita el código de barras '" + bar + "' en la misma compra");
      }
    }
  }

  private String huella(CompraRequest r) {
    StringBuilder s =
        new StringBuilder()
            .append(r.proveedorId())
            .append('|')
            .append(r.fechaRecepcion())
            .append('|')
            .append(limpiar(r.numero()));
    for (LineaCompraRequest d : r.detalles()) {
      if (d.esNuevo()) {
        s.append("|N:")
            .append(d.nuevoProducto().nombre().trim().toLowerCase(Locale.ROOT))
            .append(':')
            .append(d.nuevoProducto().categoriaId())
            .append(':')
            .append(d.cantidad())
            .append(':')
            .append(d.precioUnitario().setScale(2, RoundingMode.HALF_UP))
            .append(':')
            .append(d.nuevoProducto().precioVenta().setScale(2, RoundingMode.HALF_UP));
      } else {
        s.append("|E:")
            .append(d.productoId())
            .append(':')
            .append(d.cantidad())
            .append(':')
            .append(d.precioUnitario().setScale(2, RoundingMode.HALF_UP));
      }
    }
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(s.toString().getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  @Transactional
  public CompraResponse anular(Long id, String actor) {
    Compra v =
        repository.bloquear(id).orElseThrow(() -> new NotFoundException("Compra no encontrada"));
    if (!"REGISTRADA".equals(v.getEstado()))
      throw new BusinessException("La operación ya fue anulada");
    for (DetalleCompra d :
        v.getDetalles().stream()
            .sorted(Comparator.comparing(DetalleCompra::getProductoId))
            .toList())
      productos.moverStock(
          d.getProductoId(),
          -d.getCantidad(),
          actor,
          "ANULAR_COMPRA",
          "C-" + v.getId(),
          "Anulación de compra");
    v.setEstado("ANULADA");
    auditoria.registrar(
        actor, "ANULAR", "COMPRA", v.getId(), "estado=REGISTRADA -> ANULADA; total=" + v.getTotal());
    return mapper.response(v);
  }

  private String limpiar(String valor) {
    return valor == null || valor.isBlank() ? null : valor.trim();
  }
}
