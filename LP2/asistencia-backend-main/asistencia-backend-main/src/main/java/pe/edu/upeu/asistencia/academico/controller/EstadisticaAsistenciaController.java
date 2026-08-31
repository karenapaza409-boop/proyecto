package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.upeu.asistencia.academico.dto.EstadisticaAsistenciaDTO;
import pe.edu.upeu.asistencia.academico.service.EstadisticaAsistenciaService;

@RestController
@RequestMapping("/api/v1/estadisticas/asistencia")
public class EstadisticaAsistenciaController {

    private final EstadisticaAsistenciaService estadisticaAsistenciaService;

    public EstadisticaAsistenciaController(
            EstadisticaAsistenciaService estadisticaAsistenciaService) {
        this.estadisticaAsistenciaService = estadisticaAsistenciaService;
    }

    @GetMapping
    public ResponseEntity<EstadisticaAsistenciaDTO> obtenerEstadisticas() {

        return ResponseEntity.ok(
                estadisticaAsistenciaService.obtenerEstadisticas()
        );
    }
}