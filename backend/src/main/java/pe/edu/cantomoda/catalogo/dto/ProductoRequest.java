package pe.edu.cantomoda.catalogo.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductoRequest(
    @NotBlank @Size(max = 50) String codigo,
    @NotBlank @Size(max = 150) String nombre,
    @NotNull @Positive Long categoriaId,
    @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal precio,
    @Size(max=50) @Pattern(regexp="[A-Za-z0-9-]*") String codigoBarras,
    @Pattern(regexp="UNIDAD") String unidadVenta,
    @PositiveOrZero Integer stockMinimo,
    @PositiveOrZero Integer stock,
    Boolean activo) {
  public ProductoRequest(String codigo, String nombre, Long categoriaId, BigDecimal precio,
      String codigoBarras, String unidadVenta, Integer stockMinimo) {
    this(codigo, nombre, categoriaId, precio, codigoBarras, unidadVenta, stockMinimo, null, null);
  }

  public ProductoRequest(String codigo, String nombre, Long categoriaId, BigDecimal precio,
      String codigoBarras, String unidadVenta, Integer stockMinimo, Integer stock) {
    this(codigo, nombre, categoriaId, precio, codigoBarras, unidadVenta, stockMinimo, stock, null);
  }
}
