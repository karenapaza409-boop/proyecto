package pe.edu.cantomoda.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pe.edu.cantomoda.catalogo.dto.ProductoDuplicadoException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ProductoDuplicadoException.class)
  ProblemDetail productoDuplicado(ProductoDuplicadoException e) {
    ProblemDetail p = problem(HttpStatus.CONFLICT, e.getMessage());
    p.setProperty("codigo", "PRODUCTO_DUPLICADO");
    p.setProperty("codigoConflictivo", e.getCodigoConflictivo());
    p.setProperty("productoExistente", e.getProductoExistente());
    return p;
  }

  @ExceptionHandler(ExternalServiceException.class)
  ProblemDetail external(ExternalServiceException e) {
    return problem(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
  }

  private ProblemDetail problem(HttpStatus status, String detail) {
    return ProblemDetail.forStatusAndDetail(status, detail);
  }

  @ExceptionHandler(NotFoundException.class)
  ProblemDetail notFound(NotFoundException e) {
    return problem(HttpStatus.NOT_FOUND, e.getMessage());
  }

  @ExceptionHandler(BusinessException.class)
  ProblemDetail conflict(BusinessException e) {
    return problem(HttpStatus.CONFLICT, e.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail invalid(MethodArgumentNotValidException e) {
    return problem(
        HttpStatus.BAD_REQUEST,
        e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .distinct()
            .collect(java.util.stream.Collectors.joining("; ")));
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    MethodArgumentTypeMismatchException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class
  })
  ProblemDetail bad(Exception e) {
    return problem(
        HttpStatus.BAD_REQUEST,
        "Datos o parámetros inválidos. Revise campos, fechas y cantidades.");
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ProblemDetail integrity(DataIntegrityViolationException e) {
    String raw =
        e.getMostSpecificCause() != null && e.getMostSpecificCause().getMessage() != null
            ? e.getMostSpecificCause().getMessage().toUpperCase(java.util.Locale.ROOT)
            : (e.getMessage() == null ? "" : e.getMessage().toUpperCase(java.util.Locale.ROOT));

    log.warn("Violación de integridad de datos detectada: {}", raw);

    // 1. Restricciones de comprobación (Check constraints)
    if (raw.contains("ORA-02290") || raw.contains("CHECK CONSTRAINT") || raw.contains("COMPROBACIÓN")) {
      if (raw.contains("CK_VENTA_EFECTIVO")) {
        return problem(HttpStatus.CONFLICT, "El efectivo recibido y el vuelto no coinciden con el total de la venta.");
      }
      if (raw.contains("CK_CLI_DOCUMENTO")) {
        return problem(HttpStatus.CONFLICT, "El documento del cliente no tiene el formato requerido (8 dígitos para DNI u 11 para RUC).");
      }
      if (raw.contains("CK_CLI_ACTIVO")) {
        return problem(HttpStatus.CONFLICT, "El estado del cliente es inválido.");
      }
      if (raw.contains("SALDO") || raw.contains("SYS_C008814")) {
        return problem(HttpStatus.CONFLICT, "Stock insuficiente para realizar el movimiento.");
      }
      if (raw.contains("CANTIDAD") || raw.contains("PRECIO") || raw.contains("SUBTOTAL") || raw.contains("TOTAL")) {
        return problem(HttpStatus.CONFLICT, "Los importes y cantidades de la operación deben ser valores positivos.");
      }
      return problem(HttpStatus.CONFLICT, "Los datos no cumplen con las reglas de validación del sistema.");
    }

    // 2. Clave foránea no encontrada al insertar/actualizar (Parent key not found)
    if (raw.contains("ORA-02291") || raw.contains("PARENT KEY") || raw.contains("CLAVE PRINCIPAL NO ENCONTRADA")) {
      if (raw.contains("CLIENTE") || raw.contains("SYS_C008745")) {
        return problem(HttpStatus.CONFLICT, "El cliente referenciado no existe en la base de datos.");
      }
      if (raw.contains("PRODUCTO") || raw.contains("SYS_C008760") || raw.contains("SYS_C008816")) {
        return problem(HttpStatus.CONFLICT, "Uno de los productos referenciados no existe en el catálogo.");
      }
      return problem(HttpStatus.CONFLICT, "El registro referenciado no existe en la base de datos.");
    }

    // 3. Clave foránea con registros secundarios al eliminar (Child record found)
    boolean esRelacionEliminacion =
        raw.contains("ORA-02292")
            || raw.contains("23503")
            || raw.contains("FOREIGN KEY")
            || raw.contains("REFERENTIAL")
            || raw.contains("CHILD RECORD")
            || raw.contains("REGISTRO SECUNDARIO");
    if (esRelacionEliminacion) {
      if (raw.contains("PRODUCTO") || raw.contains("DETALLE") || raw.contains("MOVIMIENTO")) {
        return problem(
            HttpStatus.CONFLICT,
            "No se puede eliminar este producto porque tiene operaciones registradas. Puedes desactivarlo.");
      }
      return problem(
          HttpStatus.CONFLICT,
          "No se puede eliminar este registro porque tiene operaciones registradas.");
    }

    // 4. Campos obligatorios no nulos (Not Null)
    if (raw.contains("ORA-01400") || raw.contains("ORA-01407") || raw.contains("CANNOT INSERT NULL") || raw.contains("NO SE PUEDE REALIZAR UNA INSERCIÓN DE NULL")) {
      return problem(HttpStatus.BAD_REQUEST, "Faltan campos obligatorios para registrar la operación.");
    }

    // 5. Longitud excesiva de campo (Value too large)
    if (raw.contains("ORA-12899") || raw.contains("VALUE TOO LARGE") || raw.contains("DEMASIADO GRANDE")) {
      return problem(HttpStatus.BAD_REQUEST, "Uno de los campos supera la longitud máxima permitida.");
    }

    // 6. Restricciones de unicidad (Unique Constraint / Primary Key)
    if (raw.contains("ORA-00001") || raw.contains("23505") || raw.contains("UNIQUE") || raw.contains("ÚNICA")) {
      if (raw.contains("UQ_VENTA_CLAVE") || raw.contains("CLAVE_OPERACION")) {
        return problem(HttpStatus.CONFLICT, "La venta ya fue confirmada con esta clave de operación.");
      }
      if (raw.contains("UQ_DETALLE_VENTA")) {
        return problem(HttpStatus.CONFLICT, "No se pueden incluir productos repetidos en el detalle de la venta.");
      }
      if (raw.contains("UQ_CLI") || raw.contains("CLIENTE") || raw.contains("DOCUMENTO") || raw.contains("SYS_C008736")) {
        return problem(HttpStatus.CONFLICT, "Ya existe un cliente con ese número de documento.");
      }
      if (raw.contains("PRODUCTO") || raw.contains("CODIGO") || raw.contains("BARRAS")) {
        return problem(HttpStatus.CONFLICT, "Ya existe un producto con ese código.");
      }
      return problem(HttpStatus.CONFLICT, "Ya existe un registro con ese código o documento.");
    }

    // 7. Fallback general
    return problem(HttpStatus.CONFLICT, "No se pudo completar la operación debido a una restricción de integridad.");
  }
}
