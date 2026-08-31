package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;

import pe.edu.upeu.asistencia.academico.dto.HorarioRequest;
import pe.edu.upeu.asistencia.academico.dto.HorarioResponse;
import pe.edu.upeu.asistencia.academico.model.Curso;
import pe.edu.upeu.asistencia.academico.model.Horario;
import pe.edu.upeu.asistencia.academico.repository.CursoRepository;
import pe.edu.upeu.asistencia.academico.repository.HorarioRepository;

import java.util.List;

@Service
public class HorarioServiceImpl implements HorarioService {

    private final HorarioRepository horarioRepository;
    private final CursoRepository cursoRepository;

    public HorarioServiceImpl(
            HorarioRepository horarioRepository,
            CursoRepository cursoRepository) {

        this.horarioRepository = horarioRepository;
        this.cursoRepository = cursoRepository;
    }

    @Override
    public List<HorarioResponse> listarTodos() {

        return horarioRepository.findAll()
                .stream()
                .map(this::convertirAResponse)
                .toList();
    }

    @Override
    public HorarioResponse obtenerPorId(Long id) {

        Horario horario = horarioRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Horario no encontrado con ID: " + id));

        return convertirAResponse(horario);
    }

    @Override
    public List<HorarioResponse> listarPorCurso(Long cursoId) {

        return horarioRepository.findByCursoId(cursoId)
                .stream()
                .map(this::convertirAResponse)
                .toList();
    }

    @Override
    public List<HorarioResponse> listarPorDia(String dia) {

        return horarioRepository.findByDia(dia)
                .stream()
                .map(this::convertirAResponse)
                .toList();
    }

    @Override
    public HorarioResponse crear(HorarioRequest request) {

        Curso curso = cursoRepository.findById(request.cursoId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Curso no encontrado con ID: "
                                        + request.cursoId()));

        Horario horario = new Horario();

        horario.setCurso(curso);
        horario.setDia(request.dia());
        horario.setHoraInicio(request.horaInicio());
        horario.setHoraFin(request.horaFin());

        if (request.toleranciaMinutos() != null) {
            horario.setToleranciaMinutos(
                    request.toleranciaMinutos());
        }

        Horario guardado = horarioRepository.save(horario);

        return convertirAResponse(guardado);
    }

    @Override
    public HorarioResponse actualizar(
            Long id,
            HorarioRequest request) {

        Horario horario = horarioRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Horario no encontrado con ID: " + id));

        Curso curso = cursoRepository.findById(request.cursoId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Curso no encontrado con ID: "
                                        + request.cursoId()));

        horario.setCurso(curso);
        horario.setDia(request.dia());
        horario.setHoraInicio(request.horaInicio());
        horario.setHoraFin(request.horaFin());

        if (request.toleranciaMinutos() != null) {
            horario.setToleranciaMinutos(
                    request.toleranciaMinutos());
        }

        Horario actualizado =
                horarioRepository.save(horario);

        return convertirAResponse(actualizado);
    }

    @Override
    public void eliminar(Long id) {

        if (!horarioRepository.existsById(id)) {
            throw new RuntimeException(
                    "Horario no encontrado con ID: " + id);
        }

        horarioRepository.deleteById(id);
    }

    private HorarioResponse convertirAResponse(
            Horario horario) {

        return new HorarioResponse(
                horario.getId(),
                horario.getCurso().getId(),
                horario.getCurso().getNombre(),
                horario.getDia(),
                horario.getHoraInicio(),
                horario.getHoraFin(),
                horario.getToleranciaMinutos()
        );
    }
}