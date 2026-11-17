package pe.edu.cantomoda.compras.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.compras.dto.*;
import pe.edu.cantomoda.compras.service.CompraService;

@RestController
@RequestMapping("/api/v1/compras")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','COMPRADOR')")
public class CompraController {
  private final CompraService service;

  private String filtroActor(JwtAuthenticationToken auth) {
    return auth.getAuthorities().stream()
            .anyMatch(
                a ->
                    a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_SUPERVISOR"))
        ? null
        : auth.getToken().getSubject();
  }

  @GetMapping
  public PageResponse<CompraResponse> listar(
      @RequestParam(required = false) String estado,
      @RequestParam(required = false) LocalDate desde,
      @RequestParam(required = false) LocalDate hasta,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "fecha") String ordenarPor,
      @RequestParam(defaultValue = "DESC") String direccion,
      JwtAuthenticationToken auth) {
    return service.listar(
        estado, desde, hasta, filtroActor(auth), page, size, ordenarPor, direccion);
  }

  @GetMapping("/resumen")
  public CompraAgregado resumen(
      @RequestParam(required = false) String estado,
      @RequestParam(required = false) LocalDate desde,
      @RequestParam(required = false) LocalDate hasta,
      JwtAuthenticationToken auth) {
    return service.resumen(estado, desde, hasta, filtroActor(auth));
  }

  @GetMapping("/{id}")
  public CompraResponse obtener(@PathVariable Long id, JwtAuthenticationToken auth) {
    return service.obtener(id, filtroActor(auth));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CompraResponse crear(
      @Valid @RequestBody CompraRequest r, @AuthenticationPrincipal Jwt jwt) {
    return service.crear(r, jwt.getSubject());
  }

  @PatchMapping("/{id}/anular")
  @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
  public CompraResponse anular(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
    return service.anular(id, jwt.getSubject());
  }
}
