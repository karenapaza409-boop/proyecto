package pe.edu.cantomoda.compras.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import lombok.*;

@Entity
@Table(name = "COMPRAS", schema = "MM_COMPRAS")
@Getter
@Setter
@NoArgsConstructor
public class Compra {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "PROVEEDOR_ID", nullable = false)
  private Proveedor proveedor;

  @Column(nullable = false)
  private LocalDateTime fecha;
  private java.time.LocalDate fechaRecepcion;
  @Column(length=10) private String tipoComprobante;
  @Column(length=20) private String serie;
  @Column(length=20) private String numero;
  @Column(length=1000) private String observaciones;

  @Column(nullable = false, length = 100)
  private String actor;

  @Column(nullable = false, length = 20)
  private String estado;

  @Column(nullable = false, precision = 14, scale = 2)
  private BigDecimal total;

  @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<DetalleCompra> detalles = new ArrayList<>();

  public void agregar(DetalleCompra d) {
    detalles.add(d);
    d.setCompra(this);
  }
}
