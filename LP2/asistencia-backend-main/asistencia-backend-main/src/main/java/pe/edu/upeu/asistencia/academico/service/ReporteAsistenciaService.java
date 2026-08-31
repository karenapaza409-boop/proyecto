package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.dto.ReporteAsistenciaDTO;

import java.time.LocalDate;

public interface ReporteAsistenciaService {

    ReporteAsistenciaDTO generarReporte(
            Long cursoId,
            LocalDate fecha
    );
}