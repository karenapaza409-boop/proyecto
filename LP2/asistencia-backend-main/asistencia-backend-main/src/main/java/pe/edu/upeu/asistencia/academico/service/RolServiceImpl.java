package pe.edu.upeu.asistencia.academico.service;

import org.springframework.stereotype.Service;
import pe.edu.upeu.asistencia.academico.model.Rol;
import pe.edu.upeu.asistencia.academico.repository.RolRepository;

import java.util.List;

@Service
public class RolServiceImpl implements RolService {

    private final RolRepository rolRepository;

    public RolServiceImpl(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    @Override
    public List<Rol> listarTodos() {
        return rolRepository.findAll();
    }

    @Override
    public Rol buscarPorId(Long id) {
        return rolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Rol no encontrado con ID: " + id
                ));
    }

    @Override
    public Rol guardar(Rol rol) {

        if (rolRepository.existsByNombre(rol.getNombre())) {
            throw new RuntimeException(
                    "El rol ya existe: " + rol.getNombre()
            );
        }

        return rolRepository.save(rol);
    }

    @Override
    public Rol actualizar(Long id, Rol rol) {

        Rol existente = buscarPorId(id);

        existente.setNombre(rol.getNombre());
        existente.setDescripcion(rol.getDescripcion());

        return rolRepository.save(existente);
    }

    @Override
    public void eliminar(Long id) {
        Rol rol = buscarPorId(id);
        rolRepository.delete(rol);
    }
}