package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.model.Rol;

import java.util.List;

public interface RolService {

    List<Rol> listarTodos();

    Rol buscarPorId(Long id);

    Rol guardar(Rol rol);

    Rol actualizar(Long id, Rol rol);

    void eliminar(Long id);
}