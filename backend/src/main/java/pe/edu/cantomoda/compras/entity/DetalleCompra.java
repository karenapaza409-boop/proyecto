package pe.edu.cantomoda.compras.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "DETALLES_COMPRA", schema = "MM_COMPRAS")
@Getter
@Setter
@NoArgsConstructor
public class DetalleCompra {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "COMPRA_ID", nullable = false)
  private Compra compra;

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
