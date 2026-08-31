package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.edu.upeu.asistencia.academico.model.ReconocimientoFacial;
import pe.edu.upeu.asistencia.academico.service.ReconocimientoFacialService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reconocimiento-facial")
public class ReconocimientoFacialController {

    private final ReconocimientoFacialService service;

    public ReconocimientoFacialController(
            ReconocimientoFacialService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ReconocimientoFacial>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReconocimientoFacial> buscarPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/identificador/{identificadorFacial}")
    public ResponseEntity<ReconocimientoFacial> buscarPorIdentificador(
            @PathVariable String identificadorFacial) {

        return ResponseEntity.ok(
                service.buscarPorIdentificador(identificadorFacial)
        );
    }

    @PostMapping
    public ResponseEntity<ReconocimientoFacial> registrar(
            @RequestBody ReconocimientoFacial reconocimiento) {

        ReconocimientoFacial nuevo =
                service.registrar(reconocimiento);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReconocimientoFacial> actualizar(
            @PathVariable Long id,
            @RequestBody ReconocimientoFacial reconocimiento) {

        return ResponseEntity.ok(
                service.actualizar(id, reconocimiento)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        service.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}