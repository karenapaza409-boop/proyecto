package pe.edu.cantomoda.catalogo.dto;

public class ProductoDuplicadoException extends RuntimeException {
  private final ProductoResponse productoExistente;
  private final String codigoConflictivo;

  public ProductoDuplicadoException(ProductoResponse productoExistente, String codigoConflictivo) {
    super(
        "El código \""
            + codigoConflictivo
            + "\" ya está registrado para el producto \""
            + productoExistente.nombre()
            + "\". Selecciónelo para continuar con la compra.");
    this.productoExistente = productoExistente;
    this.codigoConflictivo = codigoConflictivo;
  }

  public ProductoResponse getProductoExistente() {
    return productoExistente;
  }

  public String getCodigoConflictivo() {
    return codigoConflictivo;
  }
}
