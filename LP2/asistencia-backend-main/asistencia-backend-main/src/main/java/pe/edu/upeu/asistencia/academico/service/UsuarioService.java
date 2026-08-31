package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.model.Usuario;

import java.util.List;

public interface UsuarioService {

    List<Usuario> listarTodos();

    Usuario buscarPorId(Long id);

    Usuario guardar(Usuario usuario);

    Usuario actualizar(Long id, Usuario usuario);

    void eliminar(Long id);
    
    List<Usuario> listarPorRol(Long rolId);
}