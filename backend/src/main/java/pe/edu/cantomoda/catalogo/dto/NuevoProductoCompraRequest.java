package pe.edu.cantomoda.catalogo.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record NuevoProductoCompraRequest(
    @Size(max = 50) String codigo,
    @NotBlank @Size(max = 150) String nombre,
    @NotNull @Positive Long categoriaId,
    @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal precioVenta,
    @Size(max = 50) @Pattern(regexp = "[A-Za-z0-9-]*") String codigoBarras,
    @Pattern(regexp = "UNIDAD") String unidadVenta) {}
