package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;
import pe.edu.upeu.asistencia.academico.dto.ReporteAsistenciaDTO;
import pe.edu.upeu.asistencia.academico.model.Asistencia;
import pe.edu.upeu.asistencia.academico.repository.AsistenciaRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReporteAsistenciaServiceImpl implements ReporteAsistenciaService {

    private final AsistenciaRepository asistenciaRepository;

    public ReporteAsistenciaServiceImpl(
            AsistenciaRepository asistenciaRepository) {
        this.asistenciaRepository = asistenciaRepository;
    }

    @Override
    public ReporteAsistenciaDTO generarReporte(
            Long cursoId,
            LocalDate fecha) {

        List<Asistencia> asistencias =
                asistenciaRepository.findByCursoIdAndFecha(
                        cursoId,
                        fecha
                );

        ReporteAsistenciaDTO reporte =
                new ReporteAsistenciaDTO();

        reporte.setCursoId(cursoId);
        reporte.setTotal(asistencias.size());

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

        reporte.setPresentes(presentes);
        reporte.setTardanzas(tardanzas);
        reporte.setAusentes(ausentes);
        reporte.setJustificados(justificados);

        int total = asistencias.size();

        if (total > 0) {
            double porcentaje =
                    ((double) (presentes + tardanzas) / total) * 100;

            reporte.setPorcentajeAsistencia(porcentaje);
        } else {
            reporte.setPorcentajeAsistencia(0);
        }

        return reporte;
    }
}