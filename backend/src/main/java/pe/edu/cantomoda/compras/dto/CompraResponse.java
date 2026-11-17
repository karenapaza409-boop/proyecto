package pe.edu.cantomoda.compras.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CompraResponse(
    Long id,
    Long proveedorId,
    String proveedor,
    LocalDateTime fecha,
    String actor,
    String estado,
    BigDecimal total,
    List<Linea> detalles,
    java.time.LocalDate fechaRecepcion, String tipoComprobante, String serie, String numero, String observaciones) {
  public record Linea(
      Long productoId,
      String productoNombre,
      Integer cantidad,
      BigDecimal precioUnitario,
      BigDecimal subtotal) {}
}
