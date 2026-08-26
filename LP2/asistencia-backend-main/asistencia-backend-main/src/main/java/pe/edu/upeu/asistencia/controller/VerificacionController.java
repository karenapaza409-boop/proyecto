package pe.edu.upeu.asistencia.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sistema")
public class VerificacionController {

    @GetMapping("/verificar")
    public Map<String, String> verificarEstado() {
        return Map.of(
            "estado", "Activo",
            "mensaje", "Backend de Sistema de Asistencia funcionando correctamente",
            "version", "1.0"
        );
    }
}