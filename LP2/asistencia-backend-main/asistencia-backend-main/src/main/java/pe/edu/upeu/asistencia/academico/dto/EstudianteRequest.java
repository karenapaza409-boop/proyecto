package pe.edu.upeu.asistencia.academico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EstudianteRequest(

        @NotBlank(message = "El código no puede estar vacío")
        @Size(
                min = 8,
                max = 10,
                message = "El código debe tener entre 8 y 10 caracteres"
        )
        String codigo,

        @NotBlank(message = "El nombre no puede estar vacío")
        @Size(
                min = 3,
                max = 100,
                message = "El nombre debe tener entre 3 y 100 caracteres"
        )
        String nombre
) {
}