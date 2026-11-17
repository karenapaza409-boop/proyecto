package pe.edu.cantomoda.compras.dto;
import java.time.LocalDateTime;
import pe.edu.cantomoda.common.dto.PageResponse;
public record ProveedorHistorial(PageResponse<CompraResponse> compras, LocalDateTime ultimaCompra) {}
