package pe.edu.cantomoda.ventas.exception;

import lombok.Getter;

@Getter
public class ClienteInactivoException extends RuntimeException {
  private final Long clienteId;
  private final String nombre;
  private final String documento;

  public ClienteInactivoException(Long clienteId, String nombre, String documento) {
    super("El cliente '" + (nombre != null && !nombre.isBlank() ? nombre : documento)
        + "' con documento " + documento + " está inactivo. Debe reactivarlo o continuar como Consumidor final.");
    this.clienteId = clienteId;
    this.nombre = nombre;
    this.documento = documento;
  }
}
