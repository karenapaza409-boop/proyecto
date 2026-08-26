package pe.edu.upeu.asistencia.academico.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.asistencia.academico.dto.EstudianteRequest;
import pe.edu.upeu.asistencia.academico.dto.EstudianteResponse;
import pe.edu.upeu.asistencia.academico.mapper.EstudianteMapper;
import pe.edu.upeu.asistencia.academico.model.Estudiante;
import pe.edu.upeu.asistencia.academico.repository.EstudianteRepository;

import java.util.List;

@Service
public class EstudianteServiceImpl implements EstudianteService {

    private static final Logger log = LoggerFactory.getLogger(EstudianteServiceImpl.class);

    private final EstudianteRepository repository;
    private final EstudianteMapper mapper;

    public EstudianteServiceImpl(EstudianteRepository repository, EstudianteMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstudianteResponse> listarTodos() {
        log.info("Listando todos los estudiantes");
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EstudianteResponse obtenerPorId(Long id) {
        log.info("Buscando estudiante con ID: {}", id);
        Estudiante estudiante = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado con id: " + id));
        return mapper.toResponse(estudiante);
    }

    @Override
    @Transactional
    public EstudianteResponse crear(EstudianteRequest request) {
        log.info("Creando nuevo estudiante con código: {}", request.codigo());
        Estudiante entidad = mapper.toEntity(request);
        Estudiante guardado = repository.save(entidad);
        return mapper.toResponse(guardado);
    }

    @Override
    @Transactional
    public EstudianteResponse actualizar(Long id, EstudianteRequest request) {
        log.info("Actualizando estudiante con ID: {}", id);
        Estudiante estudiante = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado con id: " + id));
        estudiante.setCodigo(request.codigo());
        estudiante.setNombre(request.nombre());
        return mapper.toResponse(repository.save(estudiante));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        log.info("Eliminando estudiante con ID: {}", id);
        if (!repository.existsById(id)) {
            throw new RuntimeException("Estudiante no encontrado con id: " + id);
        }
        repository.deleteById(id);
    }
}