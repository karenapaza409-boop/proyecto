package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.dto.HorarioRequest;
import pe.edu.upeu.asistencia.academico.dto.HorarioResponse;

import java.util.List;

public interface HorarioService {

    List<HorarioResponse> listarTodos();

    HorarioResponse obtenerPorId(Long id);

    List<HorarioResponse> listarPorCurso(Long cursoId);

    List<HorarioResponse> listarPorDia(String dia);

    HorarioResponse crear(HorarioRequest request);

    HorarioResponse actualizar(Long id, HorarioRequest request);

    void eliminar(Long id);
}