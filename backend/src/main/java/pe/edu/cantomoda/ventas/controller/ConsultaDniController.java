package pe.edu.cantomoda.ventas.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.common.exception.ExternalServiceException;
import pe.edu.cantomoda.ventas.service.ConsultaDniProvider;

@RestController
@RequestMapping("/api/v1/clientes/consulta-dni")
public class ConsultaDniController {
  private final ObjectProvider<ConsultaDniProvider> providers;
  public ConsultaDniController(ObjectProvider<ConsultaDniProvider> providers) { this.providers = providers; }
  public record Consulta(@Pattern(regexp = "[0-9]{8}") String dni) {}

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ConsultaDniProvider.Persona consultar(@Valid @RequestBody Consulta request) {
    if (request.dni() == null) throw new IllegalArgumentException("DNI requerido");
    var provider = providers.getIfAvailable();
    if (provider != null) {
      try {
        var persona = provider.consultar(request.dni());
        if (persona != null && persona.nombres() != null && !persona.nombres().isBlank()
            && persona.apellidoPaterno() != null && !persona.apellidoPaterno().isBlank()) return persona;
      } catch (RuntimeException ignored) { /* No filtrar datos ni errores del proveedor. */ }
    }
    throw new ExternalServiceException("Consulta DNI no disponible. Ingrese nombres y apellidos manualmente.");
  }
}
