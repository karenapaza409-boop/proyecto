package pe.edu.cantomoda.ventas.controller;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.edu.cantomoda.ventas.exception.ClienteDuplicadoException;
import pe.edu.cantomoda.ventas.exception.ClienteInactivoException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(assignableTypes = ClienteController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ClienteErrores {
  @ExceptionHandler(ClienteDuplicadoException.class)
  public ProblemDetail duplicado(ClienteDuplicadoException e) {
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    p.setProperty("duplicadoId", e.getClienteId());
    p.setProperty("errors", Map.of("documento", "Ya existe un cliente con este documento."));
    return p;
  }

  @ExceptionHandler(ClienteInactivoException.class)
  public ProblemDetail inactivo(ClienteInactivoException e) {
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    p.setProperty("codigo", "CLIENTE_INACTIVO");
    p.setProperty("clienteId", e.getClienteId());
    p.setProperty("clienteNombre", e.getNombre());
    p.setProperty("clienteDocumento", e.getDocumento());
    return p;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ProblemDetail validacion(MethodArgumentNotValidException e) {
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Revise los campos indicados.");
    var errors = new LinkedHashMap<String, String>();
    for (var field : e.getBindingResult().getFieldErrors()) {
      errors.putIfAbsent(field.getField().equals("documentoValido") ? "documento" : field.getField().equals("identidadValida") ? "nombres" : field.getField(), field.getDefaultMessage());
    }
    p.setProperty("errors", errors);
    return p;
  }
}
