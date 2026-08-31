package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.edu.upeu.asistencia.academico.dto.RolDTO;
import pe.edu.upeu.asistencia.academico.dto.UsuarioDTO;
import pe.edu.upeu.asistencia.academico.model.Usuario;
import pe.edu.upeu.asistencia.academico.service.UsuarioService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarTodos() {

        List<UsuarioDTO> usuarios = usuarioService.listarTodos()
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(usuarios);
    }

    private UsuarioDTO convertirADTO(Usuario usuario) {

        RolDTO rolDTO = null;

        if (usuario.getRol() != null) {
            rolDTO = new RolDTO(
                    usuario.getRol().getId(),
                    usuario.getRol().getNombre(),
                    usuario.getRol().getDescripcion()
            );
        }

        return new UsuarioDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getUsername(),
                rolDTO,
                usuario.isActivo()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                usuarioService.buscarPorId(id)
        );
    }

    @PostMapping
    public ResponseEntity<Usuario> guardar(
            @RequestBody Usuario usuario) {

        Usuario nuevo = usuarioService.guardar(usuario);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(
            @PathVariable Long id,
            @RequestBody Usuario usuario) {

        return ResponseEntity.ok(
                usuarioService.actualizar(id, usuario)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        usuarioService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}