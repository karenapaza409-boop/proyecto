package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;

import pe.edu.upeu.asistencia.academico.model.Asistencia;
import pe.edu.upeu.asistencia.academico.model.Curso;
import pe.edu.upeu.asistencia.academico.model.ReconocimientoFacial;

import pe.edu.upeu.asistencia.academico.repository.AsistenciaRepository;
import pe.edu.upeu.asistencia.academico.repository.CursoRepository;
import pe.edu.upeu.asistencia.academico.repository.ReconocimientoFacialRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class AsistenciaServiceImpl implements AsistenciaService {

    private final AsistenciaRepository repository;
    private final ReconocimientoFacialRepository reconocimientoRepository;
    private final CursoRepository cursoRepository;

    public AsistenciaServiceImpl(
            AsistenciaRepository repository,
            ReconocimientoFacialRepository reconocimientoRepository,
            CursoRepository cursoRepository) {

        this.repository = repository;
        this.reconocimientoRepository = reconocimientoRepository;
        this.cursoRepository = cursoRepository;
    }

    @Override
    public List<Asistencia> listarTodas() {
        return repository.findAll();
    }

    @Override
    public Asistencia buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Asistencia no encontrada con ID: " + id
                ));
    }

    @Override
    public List<Asistencia> listarPorEstudiante(Long estudianteId) {
        return repository.findByEstudianteId(estudianteId);
    }

    @Override
    public List<Asistencia> listarPorFecha(LocalDate fecha) {
        return repository.findByFecha(fecha);
    }

    @Override
    public Asistencia registrar(Asistencia asistencia) {

        if (asistencia.getFecha() == null) {
            asistencia.setFecha(LocalDate.now());
        }

        if (asistencia.getHora() == null) {
            asistencia.setHora(LocalTime.now());
        }

        if (asistencia.getEstado() == null ||
                asistencia.getEstado().isBlank()) {
            asistencia.setEstado("PRESENTE");
        }

        return repository.save(asistencia);
    }

    @Override
    public void eliminar(Long id) {
        Asistencia asistencia = buscarPorId(id);
        repository.delete(asistencia);
    }

    @Override
    public Asistencia registrarPorIdentificadorFacial(
            String identificadorFacial,
            Long cursoId) {

        ReconocimientoFacial reconocimiento =
                reconocimientoRepository
                        .findByIdentificadorFacial(identificadorFacial)
                        .orElseThrow(() -> new RuntimeException(
                                "Rostro no reconocido: "
                                        + identificadorFacial
                        ));

        Curso curso = cursoRepository.findById(cursoId)
                .orElseThrow(() -> new RuntimeException(
                        "Curso no encontrado con ID: " + cursoId
                ));

        Asistencia asistencia = new Asistencia();

        asistencia.setEstudiante(
                reconocimiento.getEstudiante()
        );

        asistencia.setCurso(curso);

        asistencia.setFecha(LocalDate.now());

        asistencia.setHora(LocalTime.now());

        asistencia.setEstado("PRESENTE");

        return repository.save(asistencia);
    }
}