package pe.edu.upeu.asistencia.academico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.asistencia.academico.model.Usuario;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);

    List<Usuario> findByRolId(Long rolId);
}