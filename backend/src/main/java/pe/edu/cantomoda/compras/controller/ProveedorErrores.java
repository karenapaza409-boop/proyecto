package pe.edu.cantomoda.compras.controller;

import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.compras.exception.ProveedorDuplicadoException;

@RestControllerAdvice(assignableTypes = ProveedorController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ProveedorErrores {
  @ExceptionHandler(ProveedorDuplicadoException.class)
  public ProblemDetail duplicado(ProveedorDuplicadoException e) {
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    p.setProperty("duplicadoId", e.getProveedorId());
    p.setProperty("errors", java.util.Map.of("documento", "Ya existe un proveedor con este documento."));
    return p;
  }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ProblemDetail validacion(MethodArgumentNotValidException e) {
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Revise los campos indicados.");
    var errors = new java.util.LinkedHashMap<String,String>();
    for (var field : e.getBindingResult().getFieldErrors())
      errors.putIfAbsent(field.getField().equals("documentoValido") ? "documento" : field.getField(), field.getDefaultMessage());
    p.setProperty("errors", errors);
    return p;
  }
}
