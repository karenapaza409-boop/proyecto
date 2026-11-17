package pe.edu.cantomoda.ventas.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "DETALLES_VENTA", schema = "MM_VENTAS")
@Getter
@Setter
@NoArgsConstructor
public class DetalleVenta {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "VENTA_ID", nullable = false)
  private Venta venta;

  @Column(nullable = false)
  private Long productoId;

  @Column(nullable = false, length = 150)
  private String productoNombre;

  @Column(nullable = false)
  private Integer cantidad;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal precioUnitario;

  @Column(nullable = false, precision = 14, scale = 2)
  private BigDecimal subtotal;
}
