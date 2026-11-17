package pe.edu.cantomoda.compras.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record CompraAgregado(Long cantidad, BigDecimal total) {
  public BigDecimal getPromedio() {
    return cantidad == 0
        ? BigDecimal.ZERO
        : total.divide(BigDecimal.valueOf(cantidad), 2, RoundingMode.HALF_UP);
  }
}
