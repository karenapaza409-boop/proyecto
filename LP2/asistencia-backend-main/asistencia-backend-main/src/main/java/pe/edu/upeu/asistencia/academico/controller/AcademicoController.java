package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.asistencia.academico.model.Curso;
import pe.edu.upeu.asistencia.academico.service.CursoService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academico/cursos")
public class AcademicoController {

    private final CursoService cursoService;

    public AcademicoController(CursoService cursoService) {
        this.cursoService = cursoService;
    }

    @GetMapping
    public ResponseEntity<List<Curso>> listarCursos() {
        return ResponseEntity.ok(cursoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Curso> obtenerCurso(@PathVariable Long id) {
        return ResponseEntity.ok(cursoService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<Curso> crearCurso(@RequestBody Curso curso) {
        return ResponseEntity.ok(cursoService.crear(curso));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Curso> actualizarCurso(
            @PathVariable Long id,
            @RequestBody Curso curso) {

        return ResponseEntity.ok(cursoService.actualizar(id, curso));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCurso(@PathVariable Long id) {

        cursoService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}