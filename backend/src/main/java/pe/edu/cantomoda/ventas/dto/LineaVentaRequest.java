package pe.edu.cantomoda.ventas.dto;

import jakarta.validation.constraints.*;

public record LineaVentaRequest(
    @NotNull @Positive Long productoId, @NotNull @Min(1) @Max(100000) Integer cantidad,
    @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) java.math.BigDecimal precioEsperado) {}
