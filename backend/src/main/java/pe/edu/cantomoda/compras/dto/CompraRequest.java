package pe.edu.cantomoda.compras.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CompraRequest(
    @NotNull @Positive Long proveedorId,
    @NotEmpty @Size(max = 100) List<@NotNull @Valid LineaCompraRequest> detalles,
    @PastOrPresent java.time.LocalDate fechaRecepcion,
    @Pattern(regexp = "|FACTURA|BOLETA|OTRO") String tipoComprobante,
    @Size(max = 20) @Pattern(regexp = "[A-Za-z0-9-]*") String serie,
    @Size(max = 20) @Pattern(regexp = "[0-9]*") String numero,
    @Size(max = 1000) String observaciones,
    @Size(max = 36) String claveOperacion) {

  public CompraRequest(
      Long proveedorId,
      List<LineaCompraRequest> detalles,
      java.time.LocalDate fechaRecepcion,
      String tipoComprobante,
      String serie,
      String numero,
      String observaciones) {
    this(
        proveedorId,
        detalles,
        fechaRecepcion,
        tipoComprobante,
        serie,
        numero,
        observaciones,
        null);
  }

  @AssertTrue(message = "Complete tipo, serie y número del comprobante, o deje los tres vacíos")
  public boolean isComprobanteCompleto() {
    boolean tipo = tipoComprobante != null && !tipoComprobante.isBlank();
    boolean s = serie != null && !serie.isBlank();
    boolean n = numero != null && !numero.isBlank();
    return tipo ? s && n : !s && !n;
  }
}
