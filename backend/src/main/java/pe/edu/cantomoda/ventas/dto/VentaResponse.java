package pe.edu.cantomoda.ventas.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VentaResponse(
    Long id,
    Long clienteId,
    String cliente,
    LocalDateTime fecha,
    String actor,
    String estado,
    BigDecimal total,
    List<Linea> detalles, String metodoPago, BigDecimal efectivoRecibido, BigDecimal vuelto, String cajero) {
  public record Linea(
      Long productoId,
      String productoNombre,
      Integer cantidad,
      BigDecimal precioUnitario,
      BigDecimal subtotal) {}
}
