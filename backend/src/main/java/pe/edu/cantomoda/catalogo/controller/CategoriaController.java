package pe.edu.cantomoda.catalogo.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.catalogo.dto.*;
import pe.edu.cantomoda.catalogo.service.CategoriaService;
import pe.edu.cantomoda.common.dto.PageResponse;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaController {
  private final CategoriaService service;

  @GetMapping("/buscar")
  public PageResponse<CategoriaResponse> buscar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Boolean activo,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.buscar(q, activo, page, size);
  }

  @GetMapping
  public ResponseEntity<List<CategoriaResponse>> listar() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(java.time.Duration.ofSeconds(15)).cachePrivate())
        .body(service.listar());
  }

  @GetMapping("/{id}")
  public CategoriaResponse obtener(@PathVariable Long id) {
    return service.obtener(id);
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public CategoriaResponse crear(@Valid @RequestBody CategoriaRequest r, @AuthenticationPrincipal Jwt jwt) {
    String actor = jwt != null ? jwt.getSubject() : "sistema";
    return service.crear(r, actor);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public CategoriaResponse actualizar(
      @PathVariable Long id, @Valid @RequestBody CategoriaRequest r, @AuthenticationPrincipal Jwt jwt) {
    String actor = jwt != null ? jwt.getSubject() : "sistema";
    return service.actualizar(id, r, actor);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
    String actor = jwt != null ? jwt.getSubject() : "sistema";
    service.eliminar(id, actor);
  }
}
