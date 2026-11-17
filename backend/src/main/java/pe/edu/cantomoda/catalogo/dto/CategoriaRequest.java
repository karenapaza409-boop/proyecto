package pe.edu.cantomoda.catalogo.dto;

import jakarta.validation.constraints.*;

public record CategoriaRequest(
    @NotBlank(message = "El nombre de la categoría es obligatorio") @Size(max = 100) String nombre,
    @Size(max = 250) String descripcion,
    Boolean activo) {}
