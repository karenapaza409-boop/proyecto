package pe.edu.upeu.asistencia.academico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.asistencia.academico.model.Asistencia;

import java.time.LocalDate;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findByEstudianteId(Long estudianteId);

    List<Asistencia> findByFecha(LocalDate fecha);

    List<Asistencia> findByEstudianteIdAndFecha(
            Long estudianteId,
            LocalDate fecha
    );

    List<Asistencia> findByCursoIdAndFecha(
            Long cursoId,
            LocalDate fecha
    );
}