package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;
import pe.edu.upeu.asistencia.academico.model.Curso;
import pe.edu.upeu.asistencia.academico.repository.CursoRepository;

import java.util.List;

@Service
public class CursoServiceImpl implements CursoService {

    private final CursoRepository cursoRepository;

    public CursoServiceImpl(CursoRepository cursoRepository) {
        this.cursoRepository = cursoRepository;
    }

    @Override
    public List<Curso> listarTodos() {
        return cursoRepository.findAll();
    }

    @Override
    public Curso obtenerPorId(Long id) {
        return cursoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Curso no encontrado con ID: " + id));
    }

    @Override
    public Curso crear(Curso curso) {
        return cursoRepository.save(curso);
    }

    @Override
    public Curso actualizar(Long id, Curso curso) {

        Curso existente = cursoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Curso no encontrado con ID: " + id));

        existente.setNombre(curso.getNombre());
        existente.setCodigo(curso.getCodigo());
        existente.setDocente(curso.getDocente());
        existente.setEstado(curso.getEstado());

        return cursoRepository.save(existente);
    }

    @Override
    public void eliminar(Long id) {

        if (!cursoRepository.existsById(id)) {
            throw new RuntimeException(
                    "Curso no encontrado con ID: " + id);
        }

        cursoRepository.deleteById(id);
    }
}