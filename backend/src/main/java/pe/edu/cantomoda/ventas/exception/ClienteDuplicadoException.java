package pe.edu.cantomoda.ventas.exception;

public class ClienteDuplicadoException extends RuntimeException {
  private final Long clienteId;
  public ClienteDuplicadoException(Long clienteId) {
    super("Ya existe un cliente con este tipo y número de documento.");
    this.clienteId = clienteId;
  }
  public Long getClienteId() { return clienteId; }
}
