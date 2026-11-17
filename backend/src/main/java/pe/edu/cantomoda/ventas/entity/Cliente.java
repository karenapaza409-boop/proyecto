package pe.edu.cantomoda.ventas.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "CLIENTES", schema = "MM_VENTAS",
    uniqueConstraints = @UniqueConstraint(name = "UK_CLI_TIPO_DOC", columnNames = {"tipo_documento", "documento"}))
@Getter
@Setter
@NoArgsConstructor
public class Cliente {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 150)
  private String nombre;
  @Column(length=75) private String nombres;
  @Column(length=75) private String apellidos;

  @Column(nullable = false, length = 20)
  private String documento;

  @Column(name = "tipo_documento", length = 3)
  private String tipoDocumento = "DNI";

  @Column(length = 30)
  private String telefono;

  @Column(length = 254)
  private String correo;

  @Convert(converter = org.hibernate.type.NumericBooleanConverter.class)
  @Column(nullable = false)
  private boolean activo = true;
}
