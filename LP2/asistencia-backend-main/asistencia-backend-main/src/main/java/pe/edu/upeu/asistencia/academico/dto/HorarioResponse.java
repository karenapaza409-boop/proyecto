package pe.edu.upeu.asistencia.academico.dto;

import java.time.LocalTime;

public record HorarioResponse(
        Long id,
        Long cursoId,
        String cursoNombre,
        String dia,
        LocalTime horaInicio,
        LocalTime horaFin,
        Integer toleranciaMinutos
) {
}