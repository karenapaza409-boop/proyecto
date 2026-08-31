package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.edu.upeu.asistencia.academico.model.Asistencia;
import pe.edu.upeu.asistencia.academico.service.AsistenciaService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/asistencias")
public class AsistenciaController {

    private final AsistenciaService service;

    public AsistenciaController(AsistenciaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Asistencia>> listarTodas() {
        return ResponseEntity.ok(service.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asistencia> buscarPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/estudiante/{estudianteId}")
    public ResponseEntity<List<Asistencia>> listarPorEstudiante(
            @PathVariable Long estudianteId) {

        return ResponseEntity.ok(
                service.listarPorEstudiante(estudianteId)
        );
    }

    @GetMapping("/fecha/{fecha}")
    public ResponseEntity<List<Asistencia>> listarPorFecha(
            @PathVariable LocalDate fecha) {

        return ResponseEntity.ok(
                service.listarPorFecha(fecha)
        );
    }

    @PostMapping
    public ResponseEntity<Asistencia> registrar(
            @RequestBody Asistencia asistencia) {

        Asistencia nueva = service.registrar(asistencia);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(nueva);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        service.eliminar(id);

        return ResponseEntity.noContent().build();
    }
    @PostMapping("/reconocimiento-facial")
public ResponseEntity<Asistencia> registrarPorIdentificadorFacial(
        @RequestParam String identificadorFacial,
        @RequestParam Long cursoId) {

    Asistencia asistencia =
            service.registrarPorIdentificadorFacial(
                    identificadorFacial,
                    cursoId
            );

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(asistencia);
}
}