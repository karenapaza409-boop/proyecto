package pe.edu.upeu.asistencia.academico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.asistencia.academico.model.Estudiante;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
}