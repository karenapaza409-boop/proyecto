package pe.edu.cantomoda.catalogo.dto;
import java.time.LocalDateTime;
public record MovimientoResponse(Long id,LocalDateTime fecha,String tipo,String referencia,int entrada,int salida,int saldo,String actor,String motivo) {}
