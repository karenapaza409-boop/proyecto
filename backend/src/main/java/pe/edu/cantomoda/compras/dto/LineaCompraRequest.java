package pe.edu.cantomoda.compras.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import pe.edu.cantomoda.catalogo.dto.NuevoProductoCompraRequest;

public record LineaCompraRequest(
    @Positive Long productoId,
    @NotNull @Min(1) @Max(100000) Integer cantidad,
    @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal precioUnitario,
    @Valid NuevoProductoCompraRequest nuevoProducto,
    String codigo,
    String nombre,
    Long categoriaId,
    BigDecimal precioVenta,
    String codigoBarras,
    String unidadVenta) {

  public LineaCompraRequest {
    if (productoId == null
        && nuevoProducto == null
        && (nombre != null || categoriaId != null || precioVenta != null || codigo != null || codigoBarras != null)) {
      nuevoProducto =
          new NuevoProductoCompraRequest(
              codigo, nombre, categoriaId, precioVenta, codigoBarras, unidadVenta);
    }
  }

  public LineaCompraRequest(Long productoId, Integer cantidad, BigDecimal precioUnitario) {
    this(productoId, cantidad, precioUnitario, null, null, null, null, null, null, null);
  }

  public LineaCompraRequest(
      Long productoId,
      Integer cantidad,
      BigDecimal precioUnitario,
      NuevoProductoCompraRequest nuevoProducto) {
    this(productoId, cantidad, precioUnitario, nuevoProducto, null, null, null, null, null, null);
  }

  public boolean esNuevo() {
    return productoId == null && nuevoProducto != null;
  }

  @AssertTrue(
      message =
          "Indique un producto existente o complete nombre, categoría y precio de venta del producto nuevo")
  public boolean isLineaValida() {
    return (productoId != null && nuevoProducto == null)
        || (productoId == null && nuevoProducto != null);
  }
}
