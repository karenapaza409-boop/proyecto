package pe.edu.cantomoda.catalogo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cantomoda.catalogo.dto.*;
import pe.edu.cantomoda.catalogo.entity.Producto;
import pe.edu.cantomoda.catalogo.mapper.ProductoMapper;
import pe.edu.cantomoda.catalogo.repository.ProductoRepository;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.common.exception.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductoService {
  private final ProductoRepository repository;
  private final CategoriaService categorias;
  private final ProductoMapper mapper;
  private final pe.edu.cantomoda.catalogo.repository.MovimientoStockRepository movimientos;
  private final pe.edu.cantomoda.auditoria.service.AuditoriaService auditoria;

  public PageResponse<ProductoResponse> listar(Long categoria, String q, String estado, int page, int size) {
    return listar(categoria, q, estado, null, page, size);
  }

  public PageResponse<ProductoResponse> listar(Long categoria, String q, String estado, Boolean activo, int page, int size) {
    if(estado!=null && !java.util.Set.of("SIN_STOCK","BAJO","DISPONIBLE","INACTIVO").contains(estado)) throw new IllegalArgumentException("Estado inválido");
    org.springframework.data.jpa.domain.Specification<Producto> filtro = (root,query,cb) -> {
      var condiciones = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
      if(categoria!=null) condiciones.add(cb.equal(root.get("categoria").get("id"),categoria));
      if(q!=null && !q.isBlank()) {
        String texto="%"+q.trim().toLowerCase(java.util.Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%";
        condiciones.add(cb.or(cb.like(cb.lower(root.get("nombre")),texto,'!'),cb.like(cb.lower(root.get("codigo")),texto,'!'),cb.like(cb.lower(root.get("codigoBarras")),texto,'!')));
      }
      if(Boolean.FALSE.equals(activo) || "INACTIVO".equals(estado)) {
        condiciones.add(cb.equal(cb.upper(root.get("unidadVenta")),"INACTIVO"));
      } else {
        condiciones.add(cb.or(cb.isNull(root.get("unidadVenta")),cb.notEqual(cb.upper(root.get("unidadVenta")),"INACTIVO")));
      }
      if("SIN_STOCK".equals(estado)) condiciones.add(cb.equal(root.get("stock"),0));
      if("BAJO".equals(estado)) condiciones.add(cb.and(cb.gt(root.get("stock"),0),cb.isNotNull(root.get("stockMinimo")),cb.lessThanOrEqualTo(root.<Integer>get("stock"),root.<Integer>get("stockMinimo"))));
      if("DISPONIBLE".equals(estado)) condiciones.add(cb.and(cb.gt(root.get("stock"),0),cb.or(cb.isNull(root.get("stockMinimo")),cb.greaterThan(root.<Integer>get("stock"),root.<Integer>get("stockMinimo")))));
      return cb.and(condiciones.toArray(jakarta.persistence.criteria.Predicate[]::new));
    };
    return PageResponse.of(repository.findAll(filtro,PageRequest.of(Math.max(page,0),Math.clamp(size,1,100),Sort.by("nombre").and(Sort.by("id")))).map(mapper::response));
  }

  public ProductoResponse obtener(Long id) {
    Producto p = entity(id);
    if (!p.isActivo()) {
      throw new NotFoundException("Producto no encontrado: " + id);
    }
    return mapper.response(p);
  }

  private Producto entity(Long id) {
    return repository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
  }

  @Transactional
  public ProductoResponse crear(ProductoRequest r) {
    String codigo = r.codigo().trim();
    repository
        .findByCodigoIgnoreCase(codigo)
        .ifPresent(
            existente -> {
              throw new ProductoDuplicadoException(mapper.response(existente), codigo);
            });
    String barras =
        r.codigoBarras() == null || r.codigoBarras().isBlank() ? null : r.codigoBarras().trim();
    if (barras != null) {
      repository
          .findByCodigoBarrasIgnoreCase(barras)
          .ifPresent(
              existente -> {
                throw new ProductoDuplicadoException(mapper.response(existente), barras);
              });
    }
    Producto p = new Producto();
    mapper.apply(p, r, categorias.entity(r.categoriaId()));
    if (r.stock() != null) p.setStock(r.stock());
    p = repository.saveAndFlush(p);
    if (r.stock() != null && r.stock() > 0) {
      registrar(p, r.stock(), "ADMIN", "SALDO_INICIAL", "INI-" + p.getId(), "Stock inicial registrado");
    }
    return mapper.response(p);
  }

  @Transactional
  public ProductoResponse crearDesdeCompra(
      NuevoProductoCompraRequest r, String actor, String referenciaCompra) {
    var cat = categorias.entity(r.categoriaId());
    if (!cat.isActivo()) {
      throw new BusinessException("La categoría seleccionada está inactiva");
    }
    String barras =
        r.codigoBarras() == null || r.codigoBarras().isBlank() ? null : r.codigoBarras().trim();
    if (barras != null) {
      repository
          .findByCodigoBarrasIgnoreCase(barras)
          .ifPresent(
              existente -> {
                throw new ProductoDuplicadoException(mapper.response(existente), barras);
              });
      repository
          .findByCodigoIgnoreCase(barras)
          .ifPresent(
              existente -> {
                throw new ProductoDuplicadoException(mapper.response(existente), barras);
              });
    }
    final String codigoSolicitado =
        r.codigo() == null || r.codigo().isBlank() ? null : r.codigo().trim();
    final String codigo;
    if (codigoSolicitado != null) {
      repository
          .findByCodigoIgnoreCase(codigoSolicitado)
          .ifPresent(
              existente -> {
                throw new ProductoDuplicadoException(
                    mapper.response(existente), codigoSolicitado);
              });
      repository
          .findByCodigoBarrasIgnoreCase(codigoSolicitado)
          .ifPresent(
              existente -> {
                throw new ProductoDuplicadoException(
                    mapper.response(existente), codigoSolicitado);
              });
      codigo = codigoSolicitado;
    } else {
      codigo = generarCodigoInterno(cat.getNombre());
    }

    Producto p = new Producto();
    p.setCodigo(codigo);
    p.setNombre(r.nombre().trim());
    p.setCategoria(cat);
    p.setPrecio(r.precioVenta().setScale(2, java.math.RoundingMode.HALF_UP));
    p.setCodigoBarras(barras);
    p.setUnidadVenta(
        r.unidadVenta() == null || r.unidadVenta().isBlank() ? "UNIDAD" : r.unidadVenta().trim());
    p.setStock(0);
    p = repository.saveAndFlush(p);
    auditoria.registrar(
        actor,
        "CREAR",
        "PRODUCTO",
        p.getId(),
        "origen=COMPRA; ref=" + referenciaCompra + "; codigo=" + p.getCodigo());
    return mapper.response(p);
  }

  private String generarCodigoInterno(String nombreCategoria) {
    String limpio =
        java.text.Normalizer.normalize(
                nombreCategoria == null ? "" : nombreCategoria, java.text.Normalizer.Form.NFD)
            .replaceAll("[^A-Za-z0-9]", "")
            .toUpperCase(java.util.Locale.ROOT);
    String prefijo =
        limpio.length() >= 3
            ? limpio.substring(0, 3)
            : (limpio + "PRD").substring(0, 3);
    var existentes = repository.buscarCodigosPorPrefijo(prefijo);
    int max = 0;
    for (String c : existentes) {
      if (c == null) continue;
      int guion = c.indexOf('-');
      if (guion >= 0 && guion + 1 < c.length()) {
        try {
          int num = Integer.parseInt(c.substring(guion + 1).trim());
          if (num > max) max = num;
        } catch (NumberFormatException ignored) {
        }
      }
    }
    int siguiente = max + 1;
    String candidato = String.format("%s-%03d", prefijo, siguiente);
    while (repository.findByCodigoIgnoreCase(candidato).isPresent()) {
      siguiente++;
      candidato = String.format("%s-%03d", prefijo, siguiente);
    }
    return candidato;
  }

  @Transactional
  public ProductoResponse actualizar(Long id, ProductoRequest r) {
    Producto p =
        repository.bloquear(id).orElseThrow(() -> new NotFoundException("Producto no encontrado"));
    String codigo = r.codigo().trim();
    repository
        .findByCodigoIgnoreCase(codigo)
        .filter(existente -> !existente.getId().equals(id))
        .ifPresent(
            existente -> {
              throw new ProductoDuplicadoException(mapper.response(existente), codigo);
            });
    String barras =
        r.codigoBarras() == null || r.codigoBarras().isBlank() ? null : r.codigoBarras().trim();
    if (barras != null) {
      repository
          .findByCodigoBarrasIgnoreCase(barras)
          .filter(existente -> !existente.getId().equals(id))
          .ifPresent(
              existente -> {
                throw new ProductoDuplicadoException(mapper.response(existente), barras);
              });
    }
    mapper.apply(p, r, categorias.entity(r.categoriaId()));
    if (r.stock() != null && r.stock() != p.getStock()) {
      int delta = r.stock() - p.getStock();
      p.setStock(r.stock());
      registrar(p, delta, "ADMIN", "CONTEO", "AJ-" + java.util.UUID.randomUUID(), "Actualización desde formulario de producto");
    }
    return mapper.response(p);
  }

  @Transactional
  public ProductoResponse cambiarEstado(Long id, boolean activo, String actor) {
    Producto p =
        repository
            .bloquear(id)
            .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
    if (p.isActivo() != activo) {
      p.setActivo(activo);
      repository.saveAndFlush(p);
      auditoria.registrar(
          actor == null || actor.isBlank() ? "ADMIN" : actor,
          activo ? "ACTIVAR" : "DESACTIVAR",
          "PRODUCTO",
          id,
          activo ? "estado=INACTIVO -> ACTIVO" : "estado=ACTIVO -> INACTIVO");
    }
    return mapper.response(p);
  }

  @Transactional
  public void eliminar(Long id) {
    Producto p =
        repository
            .bloquear(id)
            .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
    String codigoOriginal = p.getCodigo();
    boolean tieneOperaciones =
        movimientos.contarOperacionesPorProductoId(id) > 0
            || repository.contarComprasPorProducto(id) > 0
            || repository.contarVentasPorProducto(id) > 0;
    if (tieneOperaciones) {
      // Eliminación lógica: el producto desaparece del catálogo activo y libera su código,
      // pero conserva intacto el historial donde fue usado (ventas, compras y movimientos).
      p.setActivo(false);
      String sufijo = "#HIST-" + p.getId();
      String nuevoCod =
          codigoOriginal.length() + sufijo.length() <= 50
              ? codigoOriginal + sufijo
              : codigoOriginal.substring(0, 50 - sufijo.length()) + sufijo;
      p.setCodigo(nuevoCod);
      p.setCodigoBarras(null);
      repository.saveAndFlush(p);
      auditoria.registrar(
          "ADMIN",
          "ELIMINAR",
          "PRODUCTO",
          id,
          "Eliminación conservando historial de operaciones: " + codigoOriginal);
      return;
    }
    movimientos.eliminarSaldoInicialPorProductoId(id);
    repository.delete(p);
    repository.flush();
    auditoria.registrar(
        "ADMIN",
        "ELIMINAR",
        "PRODUCTO",
        id,
        "Eliminación de producto sin operaciones: " + codigoOriginal);
  }

  // Public API used by ventas/compras. Same transaction, locked rows, ascending IDs in callers.
  @Transactional
  public ProductoResponse moverStock(Long id, int cantidad, String actor, String tipo, String referencia, String motivo) {
    Producto p =
        repository
            .bloquear(id)
            .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
    if (("COMPRA".equals(tipo) || "VENTA".equals(tipo)) && !p.isActivo()) {
      throw new BusinessException(
          "El producto '" + p.getNombre() + "' está inactivo y no puede añadirse a nuevas compras o ventas.");
    }
    long nuevo = (long) p.getStock() + cantidad;
    if (nuevo < 0) throw new BusinessException("Stock insuficiente: " + p.getNombre());
    if (nuevo > Integer.MAX_VALUE) throw new BusinessException("Stock fuera de rango");
    p.setStock((int) nuevo);
    registrar(p,cantidad,actor,tipo,referencia,motivo);
    return mapper.response(p);
  }

  private void registrar(Producto p,int cantidad,String actor,String tipo,String referencia,String motivo) {
    var m=new pe.edu.cantomoda.catalogo.entity.MovimientoStock();
    m.setProducto(p);m.setCantidad(cantidad);m.setSaldo(p.getStock());m.setFecha(java.time.LocalDateTime.now());
    m.setTipo(tipo);m.setReferencia(referencia);m.setActor(actor);m.setMotivo(motivo);movimientos.save(m);
  }
  public PageResponse<MovimientoResponse> movimientos(Long id,java.time.LocalDate desde,java.time.LocalDate hasta,String tipo,int page,int size) {
    entity(id);
    if(desde!=null && hasta!=null && desde.isAfter(hasta)) throw new IllegalArgumentException("Rango inválido");
    if(tipo!=null && !java.util.Set.of("SALDO_INICIAL","COMPRA","VENTA","ANULAR_COMPRA","ANULAR_VENTA","MERMA","CONTEO").contains(tipo)) throw new IllegalArgumentException("Tipo inválido");
    return PageResponse.of(movimientos.buscar(id,desde==null?null:desde.atStartOfDay(),hasta==null?null:hasta.plusDays(1).atStartOfDay(),tipo,
      PageRequest.of(Math.max(0,page),Math.clamp(size,1,100),Sort.by(Sort.Direction.DESC,"id")))
      .map(m->new MovimientoResponse(m.getId(),m.getFecha(),m.getTipo(),m.getReferencia(),Math.max(0,m.getCantidad()),Math.max(0,-m.getCantidad()),m.getSaldo(),m.getActor(),m.getMotivo())));
  }
  @Transactional
  public ProductoResponse ajustar(Long id,String tipo,int cantidad,int stockEsperado,String motivo,String actor) {
    var p=repository.bloquear(id).orElseThrow(()->new NotFoundException("Producto no encontrado"));
    if(p.getStock()!=stockEsperado) throw new BusinessException("El stock cambió. Actualice la ficha y revise el ajuste antes de confirmar.");
    int delta;
    if("MERMA".equals(tipo)) { if(cantidad<=0) throw new IllegalArgumentException("Merma positiva requerida"); delta=-cantidad; }
    else if("CONTEO".equals(tipo)) { if(cantidad<0)throw new IllegalArgumentException("Conteo negativo"); delta=cantidad-p.getStock(); }
    else throw new IllegalArgumentException("Tipo inválido");
    var result=moverStock(id,delta,actor,tipo,"AJ-"+java.util.UUID.randomUUID(),motivo.trim());
    auditoria.registrar(actor,tipo,"PRODUCTO",id,"stock="+stockEsperado+" -> "+result.stock()+"; motivo="+motivo.trim());
    return result;
  }

  public java.util.Map<Long, String> codigosPorIds(java.util.Collection<Long> ids) {
    if (ids == null || ids.isEmpty()) return java.util.Map.of();
    return repository.findAllById(ids).stream()
        .collect(java.util.stream.Collectors.toMap(
            Producto::getId,
            Producto::getCodigo,
            (c1, c2) -> c1));
  }
}
