package pe.edu.cantomoda.catalogo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "CATEGORIAS", schema = "MM_CATALOGO")
@Getter
@Setter
@NoArgsConstructor
public class Categoria {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String nombre;

  @Column(length = 250)
  private String descripcion;

  @Convert(converter = org.hibernate.type.NumericBooleanConverter.class)
  @Column(nullable = false)
  private boolean activo = true;
}
