package pe.edu.cantomoda.compras.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "PROVEEDORES", schema = "MM_COMPRAS",
    uniqueConstraints = @UniqueConstraint(name = "UK_PROV_TIPO_DOC", columnNames = {"tipo_documento", "documento"}))
@Getter
@Setter
@NoArgsConstructor
public class Proveedor {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 150)
  private String nombre;

  @Column(nullable = false, length = 20)
  private String documento;

  // Null en registros anteriores: no inferir el tipo de documento.
  @Column(name = "tipo_documento", length = 3)
  private String tipoDocumento;
  @Column(name = "nombre_comercial", length = 150)
  private String nombreComercial;
  @Column(name = "persona_contacto", length = 150)
  private String personaContacto;
  @Column(length = 30)
  private String telefono;
  @Column(length = 254)
  private String correo;
  @Column(length = 250)
  private String direccion;
  @Convert(converter = org.hibernate.type.NumericBooleanConverter.class)
  @Column(nullable = false)
  private boolean activo = true;
}
