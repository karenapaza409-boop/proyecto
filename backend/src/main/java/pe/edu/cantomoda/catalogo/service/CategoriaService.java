package pe.edu.cantomoda.catalogo.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.catalogo.dto.*;
import pe.edu.cantomoda.catalogo.entity.Categoria;
import pe.edu.cantomoda.catalogo.mapper.CategoriaMapper;
import pe.edu.cantomoda.catalogo.repository.CategoriaRepository;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.common.exception.NotFoundException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoriaService {
  private final CategoriaRepository repository;
  private final CategoriaMapper mapper;
  private final AuditoriaService auditoria;

  public List<CategoriaResponse> listar() {
    return repository.findByActivoTrue(Sort.by("nombre")).stream()
        .map(c -> mapper.response(c, repository.contarProductosPorCategoria(c.getId())))
        .toList();
  }

  public PageResponse<CategoriaResponse> buscar(String q, Boolean activo, int page, int size) {
    var p = repository.buscar(
        q != null && !q.isBlank() ? q.trim() : null,
        activo,
        PageRequest.of(Math.max(0, page), Math.clamp(size, 1, 100), Sort.by("nombre").and(Sort.by("id")))
    );
    return PageResponse.of(p.map(c -> mapper.response(c, repository.contarProductosPorCategoria(c.getId()))));
  }

  public CategoriaResponse obtener(Long id) {
    Categoria e = entity(id);
    return mapper.response(e, repository.contarProductosPorCategoria(e.getId()));
  }

  public Categoria entity(Long id) {
    return repository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Categoría no encontrada"));
  }

  @Transactional
  public CategoriaResponse crear(CategoriaRequest r, String actor) {
    Categoria e = new Categoria();
    mapper.apply(e, r);
    Categoria guardada = repository.save(e);
    auditoria.registrar(actor, "CREAR", "CATEGORIAS", guardada.getId(), "Creación de categoría: " + guardada.getNombre());
    return mapper.response(guardada, 0L);
  }

  @Transactional
  public CategoriaResponse actualizar(Long id, CategoriaRequest r, String actor) {
    Categoria e = entity(id);
    mapper.apply(e, r);
    Categoria guardada = repository.save(e);
    auditoria.registrar(actor, "ACTUALIZAR", "CATEGORIAS", guardada.getId(), "Actualización de categoría: " + guardada.getNombre());
    return mapper.response(guardada, repository.contarProductosPorCategoria(guardada.getId()));
  }

  @Transactional
  public void eliminar(Long id, String actor) {
    Categoria e = entity(id);
    repository.delete(e);
    repository.flush();
    auditoria.registrar(actor, "ELIMINAR", "CATEGORIAS", id, "Eliminación de categoría");
  }
}
