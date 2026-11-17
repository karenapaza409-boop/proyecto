package pe.edu.cantomoda.ventas.controller;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.edu.cantomoda.ventas.exception.ClienteInactivoException;
import pe.edu.cantomoda.ventas.exception.PrecioCambiadoException;

@RestControllerAdvice(assignableTypes = VentaController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class VentaErrores {

  @ExceptionHandler(PrecioCambiadoException.class)
  public ProblemDetail precio(PrecioCambiadoException e) {
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    p.setProperty("codigo", "PRECIO_CAMBIO");
    return p;
  }

  @ExceptionHandler(ClienteInactivoException.class)
  public ProblemDetail clienteInactivo(ClienteInactivoException e) {
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    p.setProperty("codigo", "CLIENTE_INACTIVO");
    p.setProperty("clienteId", e.getClienteId());
    p.setProperty("clienteNombre", e.getNombre());
    p.setProperty("clienteDocumento", e.getDocumento());
    return p;
  }
}
