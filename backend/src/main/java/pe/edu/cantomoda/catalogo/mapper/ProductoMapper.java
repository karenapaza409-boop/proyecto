package pe.edu.cantomoda.catalogo.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pe.edu.cantomoda.catalogo.dto.*;
import pe.edu.cantomoda.catalogo.entity.*;

@Component
@RequiredArgsConstructor
public class ProductoMapper {
  private final CategoriaMapper categoriaMapper;

  public ProductoResponse response(Producto p) {
    String unidad =
        p.getUnidadVenta() == null || "INACTIVO".equalsIgnoreCase(p.getUnidadVenta())
            ? "UNIDAD"
            : p.getUnidadVenta();
    return new ProductoResponse(
        p.getId(),
        p.getCodigo(),
        p.getNombre(),
        categoriaMapper.response(p.getCategoria()),
        p.getPrecio(),
        p.getStock(),
        p.getCodigoBarras(),
        unidad,
        p.getStockMinimo(),
        p.isActivo());
  }

  public void apply(Producto p, ProductoRequest r, Categoria c) {
    boolean estabaActivo = p.isActivo();
    p.setCodigo(r.codigo().trim());
    p.setNombre(r.nombre().trim());
    p.setCategoria(c);
    p.setPrecio(r.precio());
    p.setCodigoBarras(r.codigoBarras() == null || r.codigoBarras().isBlank() ? null : r.codigoBarras().trim());
    if (r.activo() != null) {
      p.setActivo(r.activo());
    } else if (!estabaActivo) {
      p.setActivo(false);
    } else if (r.unidadVenta() != null) {
      p.setUnidadVenta(r.unidadVenta());
    }
    if (r.stockMinimo()!=null) p.setStockMinimo(r.stockMinimo());
  }
}
