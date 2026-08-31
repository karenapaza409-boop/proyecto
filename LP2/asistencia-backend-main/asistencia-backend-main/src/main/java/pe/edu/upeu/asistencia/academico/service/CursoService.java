package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.model.Curso;

import java.util.List;

public interface CursoService {

    List<Curso> listarTodos();

    Curso obtenerPorId(Long id);

    Curso crear(Curso curso);

    Curso actualizar(Long id, Curso curso);

    void eliminar(Long id);
}