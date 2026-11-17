package pe.edu.cantomoda.auditoria.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "REGISTROS", schema = "MM_AUDITORIA")
@Getter
@Setter
@NoArgsConstructor
public class RegistroAuditoria {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String actor;

  @Column(nullable = false, length = 20)
  private String accion;

  @Column(nullable = false, length = 20)
  private String entidad;

  @Column(nullable = false)
  private Long entidadId;

  @Column(nullable = false)
  private LocalDateTime fecha;

  @Column(nullable = false, length = 500)
  private String detalle;
}
