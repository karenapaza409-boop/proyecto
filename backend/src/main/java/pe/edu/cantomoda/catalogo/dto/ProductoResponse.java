package pe.edu.cantomoda.catalogo.dto;

import java.math.BigDecimal;

public record ProductoResponse(
    Long id,
    String codigo,
    String nombre,
    CategoriaResponse categoria,
    BigDecimal precio,
    Integer stock,
    String codigoBarras,
    String unidadVenta,
    Integer stockMinimo,
    Boolean activo) {
  public ProductoResponse(
      Long id,
      String codigo,
      String nombre,
      CategoriaResponse categoria,
      BigDecimal precio,
      Integer stock,
      String codigoBarras,
      String unidadVenta,
      Integer stockMinimo) {
    this(id, codigo, nombre, categoria, precio, stock, codigoBarras, unidadVenta, stockMinimo, true);
  }
}
