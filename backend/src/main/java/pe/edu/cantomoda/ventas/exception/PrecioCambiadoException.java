package pe.edu.cantomoda.ventas.exception;
public class PrecioCambiadoException extends RuntimeException {
 public PrecioCambiadoException(){super("El precio de uno o más productos cambió. Actualice los precios y revise el total antes de confirmar.");}
}
