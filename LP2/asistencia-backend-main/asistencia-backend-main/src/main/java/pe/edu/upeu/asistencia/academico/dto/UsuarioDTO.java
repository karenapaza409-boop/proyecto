package pe.edu.upeu.asistencia.academico.dto;

public class UsuarioDTO {

    private Long id;
    private String nombre;
    private String username;
    private RolDTO rol;
    private boolean activo;

    public UsuarioDTO() {
    }

    public UsuarioDTO(Long id, String nombre, String username,
                      RolDTO rol, boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.username = username;
        this.rol = rol;
        this.activo = activo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public RolDTO getRol() {
        return rol;
    }

    public void setRol(RolDTO rol) {
        this.rol = rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}