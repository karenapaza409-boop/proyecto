package pe.edu.upeu.asistencia.academico.model;

import jakarta.persistence.*;

@Entity
@Table(name = "reconocimientos_faciales")
public class ReconocimientoFacial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "estudiante_id", nullable = false, unique = true)
    private Estudiante estudiante;

    @Column(name = "identificador_facial", nullable = false, unique = true)
    private String identificadorFacial;

    @Column(nullable = false)
    private boolean activo = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public String getIdentificadorFacial() {
        return identificadorFacial;
    }

    public void setIdentificadorFacial(String identificadorFacial) {
        this.identificadorFacial = identificadorFacial;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}