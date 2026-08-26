package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.dto.EstudianteRequest;
import pe.edu.upeu.asistencia.academico.dto.EstudianteResponse;
import java.util.List;

public interface EstudianteService {
    List<EstudianteResponse> listarTodos();
    EstudianteResponse obtenerPorId(Long id);
    EstudianteResponse crear(EstudianteRequest request);
    EstudianteResponse actualizar(Long id, EstudianteRequest request);
    void eliminar(Long id);
}