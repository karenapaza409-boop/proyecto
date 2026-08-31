package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.model.Asistencia;

import java.time.LocalDate;
import java.util.List;

public interface AsistenciaService {

    List<Asistencia> listarTodas();

    Asistencia buscarPorId(Long id);

    List<Asistencia> listarPorEstudiante(Long estudianteId);

    List<Asistencia> listarPorFecha(LocalDate fecha);

    Asistencia registrar(Asistencia asistencia);

    void eliminar(Long id);
    Asistencia registrarPorIdentificadorFacial(
        String identificadorFacial,
        Long cursoId
);
}