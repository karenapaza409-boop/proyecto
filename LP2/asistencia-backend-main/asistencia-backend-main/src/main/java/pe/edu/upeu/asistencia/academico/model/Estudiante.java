package pe.edu.upeu.asistencia.academico.model;

import jakarta.persistence.*;

@Entity
@Table(name = "estudiantes")
public class Estudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private String nombre;

    /**
     * Descriptor facial del estudiante.
     *
     * Se almacena como texto JSON.
     * Ejemplo:
     * [0.123, -0.456, 0.789, ...]
     */
    @Lob
    @Column(name = "rostro_descriptor")
    private String rostroDescriptor;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getRostroDescriptor() {
        return rostroDescriptor;
    }

    public void setRostroDescriptor(String rostroDescriptor) {
        this.rostroDescriptor = rostroDescriptor;
    }
}