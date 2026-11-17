package pe.edu.cantomoda.compras.exception;

public class ProveedorDuplicadoException extends RuntimeException {
  private final Long proveedorId;
  public ProveedorDuplicadoException(Long proveedorId) {
    super("Ya existe un proveedor con ese documento. Abra su ficha para revisar sus datos.");
    this.proveedorId = proveedorId;
  }
  public Long getProveedorId() { return proveedorId; }
}
