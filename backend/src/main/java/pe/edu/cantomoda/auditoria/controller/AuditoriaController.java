package pe.edu.cantomoda.auditoria.controller;

import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.auditoria.dto.AuditoriaResponse;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.common.dto.PageResponse;

@RestController
@RequestMapping("/api/v1/auditoria")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditoriaController {
  private final AuditoriaService service;

  @GetMapping
  public PageResponse<AuditoriaResponse> listar(
      @RequestParam(required = false) LocalDate desde,
      @RequestParam(required = false) LocalDate hasta,
      @RequestParam(required = false) String usuario,
      @RequestParam(required = false) String modulo,
      @RequestParam(required = false) String accion,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.listar(desde, hasta, usuario, modulo, accion, page, size);
  }
}
