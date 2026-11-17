package pe.edu.cantomoda.catalogo.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "PRODUCTOS", schema = "MM_CATALOGO")
@Getter
@Setter
@NoArgsConstructor
public class Producto {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 50)
  private String codigo;

  @Column(nullable = false, length = 150)
  private String nombre;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "CATEGORIA_ID", nullable = false)
  private Categoria categoria;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal precio;

  @Column(nullable = false)
  private Integer stock = 0;
  @Column(length=50, unique=true) private String codigoBarras;
  @Column(length=10) private String unidadVenta;
  private Integer stockMinimo;

  public boolean isActivo() {
    return !"INACTIVO".equalsIgnoreCase(unidadVenta);
  }

  public void setActivo(boolean activo) {
    this.unidadVenta = activo ? "UNIDAD" : "INACTIVO";
  }
}
