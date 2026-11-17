package pe.edu.cantomoda.ventas.controller;

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
import pe.edu.cantomoda.ventas.dto.*;
import pe.edu.cantomoda.ventas.service.VentaService;

@RestController
@RequestMapping("/api/v1/ventas")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','VENDEDOR')")
public class VentaController {
  private final VentaService service;
  private final pe.edu.cantomoda.ventas.service.VentaConfirmacionService confirmacion;

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
  public PageResponse<VentaResponse> listar(
      @RequestParam(required = false) String estado,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) LocalDate desde,
      @RequestParam(required = false) LocalDate hasta,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "fecha") String ordenarPor,
      @RequestParam(defaultValue = "DESC") String direccion,
      JwtAuthenticationToken auth) {
    return service.listar(
        estado, desde, hasta, filtroActor(auth), page, size, ordenarPor, direccion,q);
  }

  @GetMapping("/resumen")
  public VentaAgregado resumen(
      @RequestParam(required = false) String estado,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) LocalDate desde,
      @RequestParam(required = false) LocalDate hasta,
      JwtAuthenticationToken auth) {
    return service.resumen(estado, desde, hasta, filtroActor(auth),q);
  }

  @GetMapping("/exportar/excel")
  public ResponseEntity<byte[]> exportarExcel(
      @RequestParam(required = false) String estado,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) LocalDate desde,
      @RequestParam(required = false) LocalDate hasta,
      JwtAuthenticationToken auth) {
    byte[] excel = service.exportarExcel(estado, desde, hasta, filtroActor(auth), q);
    String filename = nombreArchivoExcel(desde, hasta);
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(filename, java.nio.charset.StandardCharsets.UTF_8).build().toString())
        .contentType(
            MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .body(excel);
  }

  private String nombreArchivoExcel(LocalDate desde, LocalDate hasta) {
    if (desde != null && hasta != null) {
      return "ventas_" + desde + "_al_" + hasta + ".xlsx";
    } else if (desde != null) {
      return "ventas_desde_" + desde + ".xlsx";
    } else if (hasta != null) {
      return "ventas_hasta_" + hasta + ".xlsx";
    } else {
      return "ventas_historico_" + LocalDate.now() + ".xlsx";
    }
  }

  @GetMapping("/{id}")
  public VentaResponse obtener(@PathVariable Long id, JwtAuthenticationToken auth) {
    return service.obtener(id, filtroActor(auth));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public VentaResponse crear(@Valid @RequestBody VentaRequest r, @AuthenticationPrincipal Jwt jwt) {
    String cajero=jwt.getClaimAsString("name");if(cajero==null||cajero.isBlank())cajero=jwt.getClaimAsString("preferred_username");
    return confirmacion.confirmar(r,jwt.getSubject(),cajero==null||cajero.isBlank()?jwt.getSubject():cajero);
  }

  @PatchMapping("/{id}/anular")
  @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
  public VentaResponse anular(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
    return service.anular(id, jwt.getSubject());
  }
}
