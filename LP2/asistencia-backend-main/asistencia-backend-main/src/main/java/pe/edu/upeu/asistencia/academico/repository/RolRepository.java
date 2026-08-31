package pe.edu.upeu.asistencia.academico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.asistencia.academico.model.Rol;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByNombre(String nombre);

    boolean existsByNombre(String nombre);
}