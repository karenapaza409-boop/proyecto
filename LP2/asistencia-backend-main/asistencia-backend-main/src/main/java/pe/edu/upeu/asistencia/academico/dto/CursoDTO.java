package pe.edu.upeu.asistencia.academico.dto;

public record CursoDTO(
        Long id,
        String nombre,
        String codigo,
        String docente,
        Boolean estado
) {
}