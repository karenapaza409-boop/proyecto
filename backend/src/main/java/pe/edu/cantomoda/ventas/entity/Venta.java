package pe.edu.cantomoda.ventas.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import lombok.*;

@Entity
@Table(name = "VENTAS", schema = "MM_VENTAS")
@Getter
@Setter
@NoArgsConstructor
public class Venta {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "CLIENTE_ID")
  private Cliente cliente;

  @Column(nullable = false)
  private LocalDateTime fecha;

  @Column(nullable = false, length = 100)
  private String actor;

  @Column(nullable = false, length = 20)
  private String estado;

  @Column(nullable = false, precision = 14, scale = 2)
  private BigDecimal total;
  @Column(length=36,unique=true) private String claveOperacion;
  @Column(length=64) private String huellaSolicitud;
  @Column(precision=14,scale=2) private BigDecimal efectivoRecibido;
  @Column(precision=14,scale=2) private BigDecimal vuelto;
  @Column(length=150) private String cajeroNombre;

  @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<DetalleVenta> detalles = new ArrayList<>();

  public void agregar(DetalleVenta d) {
    detalles.add(d);
    d.setVenta(this);
  }
}
