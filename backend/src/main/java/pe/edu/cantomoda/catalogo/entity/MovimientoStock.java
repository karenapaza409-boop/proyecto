package pe.edu.cantomoda.catalogo.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="MOVIMIENTOS_STOCK",schema="MM_CATALOGO") @Getter @Setter @NoArgsConstructor
public class MovimientoStock {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="producto_id",nullable=false) private Producto producto;
  @Column(nullable=false) private LocalDateTime fecha;
  @Column(nullable=false,length=30) private String tipo;
  @Column(nullable=false,length=100) private String referencia;
  @Column(nullable=false) private Integer cantidad;
  @Column(nullable=false) private Integer saldo;
  @Column(nullable=false,length=100) private String actor;
  @Column(nullable=false,length=500) private String motivo;
}
