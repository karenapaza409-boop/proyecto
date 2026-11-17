package pe.edu.cantomoda.catalogo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.catalogo.dto.*;
import pe.edu.cantomoda.catalogo.service.ProductoService;
import pe.edu.cantomoda.common.dto.PageResponse;

@RestController
@RequestMapping("/api/v1/productos")
@RequiredArgsConstructor
public class ProductoController {
  private final ProductoService service;

  @GetMapping
  public PageResponse<ProductoResponse> listar(
      @RequestParam(required = false) Long categoriaId,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String estadoStock,
      @RequestParam(required = false) Boolean activo,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.listar(categoriaId, q, estadoStock, activo, page, size);
  }

  @GetMapping("/{id}")
  public ProductoResponse obtener(@PathVariable Long id) {
    return service.obtener(id);
  } 

  @GetMapping("/{id}/movimientos")
  @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
  public PageResponse<MovimientoResponse> movimientos(@PathVariable Long id,@RequestParam(required=false) java.time.LocalDate desde,@RequestParam(required=false) java.time.LocalDate hasta,@RequestParam(required=false) String tipo,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
    return service.movimientos(id,desde,hasta,tipo,page,size);
  }
  public record Ajuste(@jakarta.validation.constraints.Pattern(regexp="MERMA|CONTEO") @jakarta.validation.constraints.NotNull String tipo,
    @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero Integer cantidad,
    @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero Integer stockEsperado,
    @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=300) String motivo) {}
  @PostMapping("/{id}/ajustes")
  @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
  public ProductoResponse ajustar(@PathVariable Long id,@Valid @RequestBody Ajuste r,@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {
    return service.ajustar(id,r.tipo(),r.cantidad(),r.stockEsperado(),r.motivo(),jwt.getSubject());
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductoResponse crear(@Valid @RequestBody ProductoRequest r) {
    return service.crear(r);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest r) {
    return service.actualizar(id, r);
  }

  public record EstadoProducto(@jakarta.validation.constraints.NotNull Boolean activo) {}

  @RequestMapping(
      value = "/{id}/estado",
      method = {RequestMethod.PUT, RequestMethod.PATCH})
  @PreAuthorize("hasRole('ADMIN')")
  public ProductoResponse cambiarEstado(
      @PathVariable Long id,
      @Valid @RequestBody EstadoProducto r,
      @org.springframework.security.core.annotation.AuthenticationPrincipal
          org.springframework.security.oauth2.jwt.Jwt jwt) {
    return service.cambiarEstado(id, r.activo(), jwt != null ? jwt.getSubject() : "ADMIN");
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable Long id) {
    service.eliminar(id);
  }
}
