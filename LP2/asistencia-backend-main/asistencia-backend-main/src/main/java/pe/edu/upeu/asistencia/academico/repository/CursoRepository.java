package pe.edu.upeu.asistencia.academico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.asistencia.academico.model.Curso;

public interface CursoRepository extends JpaRepository<Curso, Long> {
}