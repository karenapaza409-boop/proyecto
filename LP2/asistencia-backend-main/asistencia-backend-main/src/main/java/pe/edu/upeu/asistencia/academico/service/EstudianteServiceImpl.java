package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;
import pe.edu.upeu.asistencia.academico.dto.EstudianteRequest;
import pe.edu.upeu.asistencia.academico.dto.EstudianteResponse;
import pe.edu.upeu.asistencia.academico.model.Estudiante;
import pe.edu.upeu.asistencia.academico.repository.EstudianteRepository;

import java.util.List;

@Service
public class EstudianteServiceImpl implements EstudianteService {

    private final EstudianteRepository estudianteRepository;

    public EstudianteServiceImpl(EstudianteRepository estudianteRepository) {
        this.estudianteRepository = estudianteRepository;
    }

    @Override
    public List<EstudianteResponse> listarTodos() {
        return estudianteRepository.findAll()
                .stream()
                .map(this::convertirAResponse)
                .toList();
    }

    @Override
    public EstudianteResponse obtenerPorId(Long id) {

        Estudiante estudiante = estudianteRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Estudiante no encontrado con ID: " + id));

        return convertirAResponse(estudiante);
    }

    @Override
    public EstudianteResponse crear(EstudianteRequest request) {

        Estudiante estudiante = new Estudiante();

        estudiante.setCodigo(request.codigo());
        estudiante.setNombre(request.nombre());

        Estudiante guardado = estudianteRepository.save(estudiante);

        return convertirAResponse(guardado);
    }

    @Override
    public EstudianteResponse actualizar(
            Long id,
            EstudianteRequest request) {

        Estudiante estudiante = estudianteRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Estudiante no encontrado con ID: " + id));

        estudiante.setCodigo(request.codigo());
        estudiante.setNombre(request.nombre());

        Estudiante actualizado =
                estudianteRepository.save(estudiante);

        return convertirAResponse(actualizado);
    }

    @Override
    public void eliminar(Long id) {

        if (!estudianteRepository.existsById(id)) {
            throw new RuntimeException(
                    "Estudiante no encontrado con ID: " + id);
        }

        estudianteRepository.deleteById(id);
    }

    private EstudianteResponse convertirAResponse(
            Estudiante estudiante) {

        return new EstudianteResponse(
                estudiante.getId(),
                estudiante.getCodigo(),
                estudiante.getNombre()
        );
    }
}