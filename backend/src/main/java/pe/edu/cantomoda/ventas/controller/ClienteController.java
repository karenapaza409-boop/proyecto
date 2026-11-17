package pe.edu.cantomoda.ventas.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.ventas.dto.*;
import pe.edu.cantomoda.ventas.service.ClienteService;

@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
public class ClienteController {
  private final ClienteService service;

  @GetMapping("/buscar")
  public PageResponse<ClienteResponse> buscar(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Boolean activo,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.buscar(q, activo, page, size);
  }

  @GetMapping("/duplicado")
  @PreAuthorize("hasRole('ADMIN')")
  public ClienteResponse duplicado(
      @RequestParam String tipoDocumento,
      @RequestParam String documento,
      @RequestParam(required = false) Long excluirId) {
    return service.duplicado(tipoDocumento, documento, excluirId);
  }

  @GetMapping
  public List<ClienteResponse> listar() {
    return service.listar();
  }

  @GetMapping("/{id}")
  public ClienteResponse obtener(@PathVariable Long id) {
    return service.obtener(id);
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public ClienteResponse crear(@Valid @RequestBody ClienteRequest r, @AuthenticationPrincipal Jwt jwt) {
    String actor = jwt != null ? jwt.getSubject() : "sistema";
    return service.crear(r, actor);
  }

  @PatchMapping("/{id}/reactivar")
  @PreAuthorize("hasRole('ADMIN')")
  public ClienteResponse reactivar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
    String actor = jwt != null ? jwt.getSubject() : "sistema";
    return service.reactivar(id, actor);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ClienteResponse actualizar(
      @PathVariable Long id, @Valid @RequestBody ClienteRequest r, @AuthenticationPrincipal Jwt jwt) {
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
