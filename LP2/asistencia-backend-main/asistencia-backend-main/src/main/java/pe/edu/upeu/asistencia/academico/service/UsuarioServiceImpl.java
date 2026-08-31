package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;

import pe.edu.upeu.asistencia.academico.model.Rol;
import pe.edu.upeu.asistencia.academico.model.Usuario;
import pe.edu.upeu.asistencia.academico.repository.RolRepository;
import pe.edu.upeu.asistencia.academico.repository.UsuarioRepository;

import java.util.List;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    public UsuarioServiceImpl(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository) {

        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
    }

    @Override
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    @Override
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Usuario no encontrado con ID: " + id
                ));
    }

    @Override
    public Usuario guardar(Usuario usuario) {

        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            throw new RuntimeException(
                    "El username ya está registrado: "
                            + usuario.getUsername()
            );
        }

        if (usuario.getRol() == null || usuario.getRol().getId() == null) {
            throw new RuntimeException(
                    "El rol es obligatorio"
            );
        }

        Rol rol = rolRepository.findById(usuario.getRol().getId())
                .orElseThrow(() -> new RuntimeException(
                        "Rol no encontrado con ID: "
                                + usuario.getRol().getId()
                ));

        usuario.setRol(rol);

        return usuarioRepository.save(usuario);
    }

    @Override
    public Usuario actualizar(Long id, Usuario usuario) {

        Usuario existente = buscarPorId(id);

        existente.setNombre(usuario.getNombre());
        existente.setUsername(usuario.getUsername());
        existente.setPassword(usuario.getPassword());
        existente.setRol(usuario.getRol());
        existente.setActivo(usuario.isActivo());

        return usuarioRepository.save(existente);
    }

    @Override
    public void eliminar(Long id) {
        Usuario usuario = buscarPorId(id);
        usuarioRepository.delete(usuario);
    }
    @Override
public List<Usuario> listarPorRol(Long rolId) {
    return usuarioRepository.findByRolId(rolId);
}
}