package pe.edu.cantomoda.ventas.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.catalogo.service.ProductoService;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.common.exception.*;
import pe.edu.cantomoda.ventas.dto.*;
import pe.edu.cantomoda.ventas.entity.*;
import pe.edu.cantomoda.ventas.exception.ClienteInactivoException;
import pe.edu.cantomoda.ventas.mapper.VentaMapper;
import pe.edu.cantomoda.ventas.repository.VentaRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VentaService {
  private final VentaRepository repository;
  private final ClienteService parties;
  private final ProductoService productos;
  private final VentaMapper mapper;
  private final AuditoriaService auditoria;
  private final VentaExcelService excelService;

  private void validar(String estado, LocalDate desde, LocalDate hasta) {
    if (desde != null && hasta != null && desde.isAfter(hasta))
      throw new IllegalArgumentException("Rango inválido");
    if (estado != null && !Set.of("REGISTRADA", "ANULADA").contains(estado))
      throw new IllegalArgumentException("Estado inválido");
  }

  public PageResponse<VentaResponse> listar(
      String estado,
      LocalDate desde,
      LocalDate hasta,
      String actor,
      int page,
      int size,
      String ordenarPor,
      String direccion) {
    return listar(estado,desde,hasta,actor,page,size,ordenarPor,direccion,null);
  }
  public PageResponse<VentaResponse> listar(String estado,LocalDate desde,LocalDate hasta,String actor,int page,int size,String ordenarPor,String direccion,String q) {
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
                texto(q),numero(q),
                PageRequest.of(
                    Math.max(0, page),
                    Math.clamp(size, 1, 100),
                    Sort.by(Sort.Direction.fromString(direccion), ordenarPor).and(Sort.by("id"))))
            .map(mapper::response));
  }

  public VentaAgregado resumen(String estado, LocalDate desde, LocalDate hasta, String actor) {
    return resumen(estado,desde,hasta,actor,null);
  }
  public VentaAgregado resumen(String estado,LocalDate desde,LocalDate hasta,String actor,String q) {
    validar(estado, desde, hasta);
    return repository.agregado(
        estado,
        desde == null ? null : desde.atStartOfDay(),
        hasta == null ? null : hasta.plusDays(1).atStartOfDay(),
        actor,texto(q),numero(q));
  }

  public byte[] exportarExcel(
      String estado, LocalDate desde, LocalDate hasta, String actor, String q) {
    validar(estado, desde, hasta);
    LocalDateTime desdeDateTime = desde == null ? null : desde.atStartOfDay();
    LocalDateTime hastaDateTime = hasta == null ? null : hasta.plusDays(1).atStartOfDay();
    List<Venta> ventas =
        repository.listarParaExportar(estado, desdeDateTime, hastaDateTime, actor, texto(q), numero(q));
    if (ventas.isEmpty()) {
      throw new BusinessException("No hay ventas para exportar");
    }
    Set<Long> productoIds = new HashSet<>();
    for (Venta v : ventas) {
      if (v.getDetalles() != null) {
        for (DetalleVenta d : v.getDetalles()) {
          if (d.getProductoId() != null) {
            productoIds.add(d.getProductoId());
          }
        }
      }
    }
    Map<Long, String> codigos = productos.codigosPorIds(productoIds);
    return excelService.generarExcel(ventas, estado, desde, hasta, actor, q, codigos);
  }

  public VentaResponse obtener(Long id, String actor) {
    Venta v =
        repository.findById(id).orElseThrow(() -> new NotFoundException("Venta no encontrada"));
    if (actor != null && !v.getActor().equals(actor))
      throw new org.springframework.security.access.AccessDeniedException(
          "Operación de otro usuario");
    return mapper.response(v);
  }

  @Transactional
  public VentaResponse crear(VentaRequest request, String actor,String cajero) {
    var existente=repetida(request,actor);
    if(existente.isPresent()) return existente.get();
    if (request.detalles() == null || request.detalles().isEmpty())
      throw new BusinessException("Agregue al menos un producto");
    long distintos =
        request.detalles().stream().map(LineaVentaRequest::productoId).distinct().count();
    if (distintos != request.detalles().size()) throw new BusinessException("No repita productos");

    Cliente cliente = resolverCliente(request, actor);
    Venta v = new Venta();
    v.setCliente(cliente);
    v.setClaveOperacion(request.claveOperacion());
    v.setHuellaSolicitud(huella(request));
    v.setCajeroNombre(cajero.length()>150?cajero.substring(0,150):cajero);
    v.setActor(actor);
    v.setFecha(LocalDateTime.now());
    v.setEstado("REGISTRADA");
    BigDecimal total = BigDecimal.ZERO;
    v.setTotal(BigDecimal.ZERO);
    repository.saveAndFlush(v);
    for (LineaVentaRequest item :
        request.detalles().stream()
            .sorted(Comparator.comparing(LineaVentaRequest::productoId))
            .toList()) {
      var p = productos.moverStock(item.productoId(), -item.cantidad(), actor, "VENTA", "V-"+v.getId(), "Venta registrada");
      if(p.precio().compareTo(item.precioEsperado())!=0) throw new pe.edu.cantomoda.ventas.exception.PrecioCambiadoException();
      DetalleVenta d = new DetalleVenta();
      d.setProductoId(p.id());
      d.setProductoNombre(p.nombre());
      d.setCantidad(item.cantidad());
      d.setPrecioUnitario(p.precio().setScale(2, RoundingMode.HALF_UP));
      d.setSubtotal(d.getPrecioUnitario().multiply(BigDecimal.valueOf(item.cantidad())));
      v.agregar(d);
      total = total.add(d.getSubtotal());
    }
    total = total.setScale(2, RoundingMode.HALF_UP);
    v.setTotal(total);
    if(request.efectivoRecibido() == null || request.efectivoRecibido().compareTo(total)<0)
      throw new BusinessException("El efectivo recibido es insuficiente para pagar la venta.");
    v.setEfectivoRecibido(request.efectivoRecibido().setScale(2,RoundingMode.HALF_UP));
    v.setVuelto(v.getEfectivoRecibido().subtract(total).setScale(2, RoundingMode.HALF_UP));
    repository.saveAndFlush(v);
    auditoria.registrar(actor, "CREAR", "VENTA", v.getId(), "estado=REGISTRADA; total=" + total);
    return mapper.response(v);
  }

  private Cliente resolverCliente(VentaRequest request, String actor) {
    if (request.clienteDocumento() != null && !request.clienteDocumento().isBlank()) {
      return parties.resolverOCrear(
          request.clienteTipoDocumento(),
          request.clienteDocumento(),
          request.clienteNombre(),
          actor);
    }
    if (request.clienteId() != null) {
      Cliente c = parties.entity(request.clienteId());
      if (!c.isActivo()) {
        throw new ClienteInactivoException(c.getId(), c.getNombre(), c.getDocumento());
      }
      return c;
    }
    return null;
  }

  public Optional<VentaResponse> repetida(VentaRequest r,String actor){
    return repository.findByClaveOperacion(r.claveOperacion()).map(v->{
      if(!v.getActor().equals(actor)||!java.util.Objects.equals(v.getHuellaSolicitud(),huella(r))) throw new BusinessException("La clave de confirmación ya fue utilizada con otros datos. Revise la operación anterior.");
      return mapper.response(v);
    });
  }

  private String huella(VentaRequest r){
    StringBuilder s=new StringBuilder()
        .append(r.clienteId())
        .append(':')
        .append(r.clienteDocumento() != null ? r.clienteDocumento().trim() : "")
        .append('|')
        .append(r.efectivoRecibido().setScale(2));
    r.detalles().stream().sorted(Comparator.comparing(LineaVentaRequest::productoId)).forEach(d->s.append('|').append(d.productoId()).append(':').append(d.cantidad()).append(':').append(d.precioEsperado().setScale(2)));
    try{return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(s.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)));}catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}
  }
  private String texto(String q){return q==null||q.isBlank()?null:"%"+q.trim().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%";}
  private String numero(String q){return q==null?null:q.trim().replaceFirst("(?i)^V-","").replaceFirst("^#","");}

  @Transactional
  public VentaResponse anular(Long id, String actor) {
    Venta v =
        repository.bloquear(id).orElseThrow(() -> new NotFoundException("Venta no encontrada"));
    if (!"REGISTRADA".equals(v.getEstado()))
      throw new BusinessException("La operación ya fue anulada");
    for (DetalleVenta d :
        v.getDetalles().stream().sorted(Comparator.comparing(DetalleVenta::getProductoId)).toList())
      productos.moverStock(d.getProductoId(), d.getCantidad(), actor, "ANULAR_VENTA", "V-"+v.getId(), "Anulación de venta");
    v.setEstado("ANULADA");
    auditoria.registrar(actor, "ANULAR", "VENTA", v.getId(), "estado=REGISTRADA -> ANULADA; total=" + v.getTotal());
    return mapper.response(v);
  }
}
