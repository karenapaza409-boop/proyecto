package pe.edu.cantomoda.catalogo.mapper;

import org.springframework.stereotype.Component;
import pe.edu.cantomoda.catalogo.dto.*;
import pe.edu.cantomoda.catalogo.entity.Categoria;

@Component
public class CategoriaMapper {
  public void apply(Categoria e, CategoriaRequest r) {
    e.setNombre(r.nombre().trim());
    e.setDescripcion(r.descripcion() != null && !r.descripcion().isBlank() ? r.descripcion().trim() : null);
    if (r.activo() != null) {
      e.setActivo(r.activo());
    }
  }

  public CategoriaResponse response(Categoria e, long cantidadProductos) {
    return new CategoriaResponse(
        e.getId(),
        e.getNombre(),
        e.getDescripcion(),
        e.isActivo(),
        cantidadProductos
    );
  }

  public CategoriaResponse response(Categoria e) {
    return response(e, 0L);
  }
}
