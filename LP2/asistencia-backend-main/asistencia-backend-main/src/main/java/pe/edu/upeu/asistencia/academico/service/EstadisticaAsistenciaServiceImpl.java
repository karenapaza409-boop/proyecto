package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;
import pe.edu.upeu.asistencia.academico.dto.EstadisticaAsistenciaDTO;
import pe.edu.upeu.asistencia.academico.model.Asistencia;
import pe.edu.upeu.asistencia.academico.repository.AsistenciaRepository;

import java.util.List;

@Service
public class EstadisticaAsistenciaServiceImpl
        implements EstadisticaAsistenciaService {

    private final AsistenciaRepository asistenciaRepository;

    public EstadisticaAsistenciaServiceImpl(
            AsistenciaRepository asistenciaRepository) {
        this.asistenciaRepository = asistenciaRepository;
    }

    @Override
    public EstadisticaAsistenciaDTO obtenerEstadisticas() {

        List<Asistencia> asistencias =
                asistenciaRepository.findAll();

        EstadisticaAsistenciaDTO estadisticas =
                new EstadisticaAsistenciaDTO();

        int presentes = 0;
        int tardanzas = 0;
        int ausentes = 0;
        int justificados = 0;

        for (Asistencia asistencia : asistencias) {

            if (asistencia.getEstado() == null) {
                continue;
            }

            switch (asistencia.getEstado().toUpperCase()) {

                case "PRESENTE":
                    presentes++;
                    break;

                case "TARDANZA":
                    tardanzas++;
                    break;

                case "AUSENTE":
                    ausentes++;
                    break;

                case "JUSTIFICADO":
                    justificados++;
                    break;

                default:
                    break;
            }
        }

        int total = asistencias.size();

        estadisticas.setTotal(total);
        estadisticas.setPresentes(presentes);
        estadisticas.setTardanzas(tardanzas);
        estadisticas.setAusentes(ausentes);
        estadisticas.setJustificados(justificados);

        if (total > 0) {

            double porcentaje =
                    ((double) (presentes + tardanzas) / total) * 100;

            estadisticas.setPorcentajeAsistencia(porcentaje);

        } else {

            estadisticas.setPorcentajeAsistencia(0);
        }

        return estadisticas;
    }
}