package pe.edu.cantomoda.compras.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.compras.dto.*;
import pe.edu.cantomoda.compras.service.ProveedorService;
import pe.edu.cantomoda.compras.service.CompraService;
import pe.edu.cantomoda.common.dto.PageResponse;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/v1/proveedores")
@RequiredArgsConstructor
public class ProveedorController {
  private final ProveedorService service;
  private final CompraService compras;

  @GetMapping("/buscar")
  public PageResponse<ProveedorResponse> buscar(@RequestParam(required=false) String q,
      @RequestParam(required=false) Boolean activo, @RequestParam(defaultValue="0") int page,
      @RequestParam(defaultValue="20") int size) {
    return service.buscar(q, activo, page, size);
  }

  @GetMapping("/duplicado")
  @PreAuthorize("hasRole('ADMIN')")
  public ProveedorResponse duplicado(@RequestParam String tipoDocumento, @RequestParam String documento,
      @RequestParam(required=false) Long excluirId) {
    return service.duplicado(tipoDocumento, documento, excluirId);
  }

  @GetMapping("/{id}/historial")
  @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','COMPRADOR')")
  public ProveedorHistorial historial(@PathVariable Long id, @RequestParam(defaultValue="0") int page,
      @RequestParam(defaultValue="10") int size, JwtAuthenticationToken auth) {
    boolean general = auth.getAuthorities().stream().anyMatch(a -> Set.of("ROLE_ADMIN", "ROLE_SUPERVISOR").contains(a.getAuthority()));
    return compras.historialProveedor(id, general ? null : auth.getName(), page, size);
  }

  public record Estado(@jakarta.validation.constraints.NotNull Boolean activo) {}
  @PutMapping("/{id}/estado")
  @PreAuthorize("hasRole('ADMIN')")
  public ProveedorResponse estado(@PathVariable Long id, @Valid @RequestBody Estado r, @AuthenticationPrincipal Jwt jwt) {
    return service.estado(id, r.activo(), jwt.getSubject());
  }

  @GetMapping
  public List<ProveedorResponse> listar() {
    return service.listar();
  }

  @GetMapping("/{id}")
  public ProveedorResponse obtener(@PathVariable Long id) {
    return service.obtener(id);
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public ProveedorResponse crear(@Valid @RequestBody ProveedorRequest r, @AuthenticationPrincipal Jwt jwt) {
    return service.crear(r, jwt.getSubject());
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ProveedorResponse actualizar(
      @PathVariable Long id, @Valid @RequestBody ProveedorRequest r, @AuthenticationPrincipal Jwt jwt) {
    return service.actualizar(id, r, jwt.getSubject());
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
    service.eliminar(id, jwt.getSubject());
  }
}
