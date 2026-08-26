package pe.edu.upeu.asistencia.academico.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.upeu.asistencia.academico.dto.CursoDTO;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academico")
public class AcademicoController {

    @GetMapping("/cursos")
    public ResponseEntity<List<CursoDTO>> listarCursos() {
        return ResponseEntity.ok(List.of(
            new CursoDTO(1L, "Lenguaje de Programación II"),
            new CursoDTO(2L, "Análisis y Diseño de Sistemas")
        ));
    }
}