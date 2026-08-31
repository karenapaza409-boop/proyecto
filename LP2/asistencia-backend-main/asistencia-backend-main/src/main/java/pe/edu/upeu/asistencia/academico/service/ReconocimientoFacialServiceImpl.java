package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;
import pe.edu.upeu.asistencia.academico.model.ReconocimientoFacial;
import pe.edu.upeu.asistencia.academico.repository.ReconocimientoFacialRepository;

import java.util.List;

@Service
public class ReconocimientoFacialServiceImpl
        implements ReconocimientoFacialService {

    private final ReconocimientoFacialRepository repository;

    public ReconocimientoFacialServiceImpl(
            ReconocimientoFacialRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<ReconocimientoFacial> listarTodos() {
        return repository.findAll();
    }

    @Override
    public ReconocimientoFacial buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Reconocimiento facial no encontrado con ID: " + id
                ));
    }

    @Override
    public ReconocimientoFacial buscarPorIdentificador(
            String identificadorFacial) {

        return repository.findByIdentificadorFacial(identificadorFacial)
                .orElseThrow(() -> new RuntimeException(
                        "Identificador facial no encontrado: "
                                + identificadorFacial
                ));
    }

    @Override
    public ReconocimientoFacial registrar(
            ReconocimientoFacial reconocimiento) {

        if (repository.existsByIdentificadorFacial(
                reconocimiento.getIdentificadorFacial())) {

            throw new RuntimeException(
                    "El identificador facial ya existe: "
                            + reconocimiento.getIdentificadorFacial()
            );
        }

        return repository.save(reconocimiento);
    }

    @Override
    public ReconocimientoFacial actualizar(
            Long id,
            ReconocimientoFacial reconocimiento) {

        ReconocimientoFacial existente = buscarPorId(id);

        existente.setEstudiante(reconocimiento.getEstudiante());
        existente.setIdentificadorFacial(
                reconocimiento.getIdentificadorFacial()
        );
        existente.setActivo(reconocimiento.isActivo());

        return repository.save(existente);
    }

    @Override
    public void eliminar(Long id) {
        ReconocimientoFacial reconocimiento = buscarPorId(id);
        repository.delete(reconocimiento);
    }
}