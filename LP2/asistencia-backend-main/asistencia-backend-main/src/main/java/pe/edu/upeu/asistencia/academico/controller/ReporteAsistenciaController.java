package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.edu.upeu.asistencia.academico.dto.ReporteAsistenciaDTO;
import pe.edu.upeu.asistencia.academico.service.ReporteAsistenciaService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reportes/asistencia")
public class ReporteAsistenciaController {

    private final ReporteAsistenciaService reporteAsistenciaService;

    public ReporteAsistenciaController(
            ReporteAsistenciaService reporteAsistenciaService) {
        this.reporteAsistenciaService = reporteAsistenciaService;
    }

    @GetMapping
    public ResponseEntity<ReporteAsistenciaDTO> generarReporte(
            @RequestParam Long cursoId,
            @RequestParam LocalDate fecha) {

        return ResponseEntity.ok(
                reporteAsistenciaService.generarReporte(
                        cursoId,
                        fecha
                )
        );
    }
}