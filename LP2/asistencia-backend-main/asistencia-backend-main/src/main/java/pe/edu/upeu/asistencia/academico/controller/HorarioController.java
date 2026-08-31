package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.edu.upeu.asistencia.academico.dto.HorarioRequest;
import pe.edu.upeu.asistencia.academico.dto.HorarioResponse;
import pe.edu.upeu.asistencia.academico.service.HorarioService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/horarios")
public class HorarioController {

    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @GetMapping
    public ResponseEntity<List<HorarioResponse>> listarTodos() {
        return ResponseEntity.ok(
                horarioService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HorarioResponse> obtenerPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                horarioService.obtenerPorId(id));
    }

    @GetMapping("/curso/{cursoId}")
    public ResponseEntity<List<HorarioResponse>> listarPorCurso(
            @PathVariable Long cursoId) {

        return ResponseEntity.ok(
                horarioService.listarPorCurso(cursoId));
    }

    @GetMapping("/dia/{dia}")
    public ResponseEntity<List<HorarioResponse>> listarPorDia(
            @PathVariable String dia) {

        return ResponseEntity.ok(
                horarioService.listarPorDia(dia));
    }

    @PostMapping
    public ResponseEntity<HorarioResponse> crear(
            @RequestBody HorarioRequest request) {

        return ResponseEntity.ok(
                horarioService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HorarioResponse> actualizar(
            @PathVariable Long id,
            @RequestBody HorarioRequest request) {

        return ResponseEntity.ok(
                horarioService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        horarioService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}