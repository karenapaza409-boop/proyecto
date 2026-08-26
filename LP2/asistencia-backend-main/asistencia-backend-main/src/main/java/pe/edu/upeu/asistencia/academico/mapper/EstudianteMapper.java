package pe.edu.upeu.asistencia.academico.mapper;

import org.springframework.stereotype.Component;
import pe.edu.upeu.asistencia.academico.dto.EstudianteRequest;
import pe.edu.upeu.asistencia.academico.dto.EstudianteResponse;
import pe.edu.upeu.asistencia.academico.model.Estudiante;

@Component
public class EstudianteMapper {

    public Estudiante toEntity(EstudianteRequest request) {
        Estudiante estudiante = new Estudiante();
        estudiante.setCodigo(request.codigo());
        estudiante.setNombre(request.nombre());
        return estudiante;
    }

    public EstudianteResponse toResponse(Estudiante entity) {
        return new EstudianteResponse(
            entity.getId(),
            entity.getCodigo(),
            entity.getNombre()
        );
    }
}