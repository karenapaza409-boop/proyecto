package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.edu.upeu.asistencia.academico.model.Rol;
import pe.edu.upeu.asistencia.academico.model.Usuario;
import pe.edu.upeu.asistencia.academico.service.RolService;
import pe.edu.upeu.asistencia.academico.service.UsuarioService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
public class RolController {

   private final RolService rolService;
   private final UsuarioService usuarioService;

    public RolController(
        RolService rolService,
        UsuarioService usuarioService) {

    this.rolService = rolService;
    this.usuarioService = usuarioService;
}

    @GetMapping
    public ResponseEntity<List<Rol>> listarTodos() {
        return ResponseEntity.ok(
                rolService.listarTodos()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rol> buscarPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                rolService.buscarPorId(id)
        );
    }

    @PostMapping
    public ResponseEntity<Rol> guardar(
            @RequestBody Rol rol) {

        Rol nuevo = rolService.guardar(rol);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rol> actualizar(
            @PathVariable Long id,
            @RequestBody Rol rol) {

        return ResponseEntity.ok(
                rolService.actualizar(id, rol)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        rolService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}/usuarios")
public ResponseEntity<List<Usuario>> listarUsuariosPorRol(
        @PathVariable Long id) {

    return ResponseEntity.ok(
            usuarioService.listarPorRol(id)
    );
}
}