package pe.edu.cantomoda.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record VentaRequest(
    @Positive Long clienteId,
    @NotEmpty @Size(max = 100) List<@NotNull @Valid LineaVentaRequest> detalles,
    @NotBlank @Pattern(regexp = "[a-fA-F0-9-]{36}") String claveOperacion,
    @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal efectivoRecibido,
    @Size(max = 3) String clienteTipoDocumento,
    @Size(max = 20) String clienteDocumento,
    @Size(max = 150) String clienteNombre) {

  public VentaRequest(
      Long clienteId,
      List<LineaVentaRequest> detalles,
      String claveOperacion,
      BigDecimal efectivoRecibido) {
    this(clienteId, detalles, claveOperacion, efectivoRecibido, null, null, null);
  }
}
