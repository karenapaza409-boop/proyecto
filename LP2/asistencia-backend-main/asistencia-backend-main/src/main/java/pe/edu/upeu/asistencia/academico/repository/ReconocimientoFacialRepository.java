package pe.edu.upeu.asistencia.academico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.asistencia.academico.model.ReconocimientoFacial;

import java.util.Optional;

public interface ReconocimientoFacialRepository
        extends JpaRepository<ReconocimientoFacial, Long> {

    Optional<ReconocimientoFacial> findByIdentificadorFacial(
            String identificadorFacial
    );

    Optional<ReconocimientoFacial> findByEstudianteId(
            Long estudianteId
    );

    boolean existsByIdentificadorFacial(
            String identificadorFacial
    );
}