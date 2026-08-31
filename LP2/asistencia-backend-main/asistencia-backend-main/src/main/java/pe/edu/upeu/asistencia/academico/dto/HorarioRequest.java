package pe.edu.upeu.asistencia.academico.dto;

import java.time.LocalTime;

public record HorarioRequest(
        Long cursoId,
        String dia,
        LocalTime horaInicio,
        LocalTime horaFin,
        Integer toleranciaMinutos
) {
}