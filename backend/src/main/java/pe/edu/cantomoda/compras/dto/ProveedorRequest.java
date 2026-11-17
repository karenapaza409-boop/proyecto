package pe.edu.cantomoda.compras.dto;

import jakarta.validation.constraints.*;

public record ProveedorRequest(
    @NotBlank(message = "Ingrese la razón social o el nombre") @Size(max = 150) String nombre,
    @NotBlank(message = "Ingrese el número de documento") @Size(max = 20) String documento,
    @NotBlank(message = "Seleccione el tipo de documento") @Pattern(regexp = "DNI|RUC", message = "Seleccione DNI o RUC") String tipoDocumento,
    @Size(max = 150) String nombreComercial,
    @Size(max = 150) String personaContacto,
    @Size(max = 30) @Pattern(regexp = "(?:\\s*|\\+?[0-9][0-9 () .-]{5,29})", message = "Ingrese un teléfono de 6 a 30 caracteres con números, espacios, + o guiones") String telefono,
    @Email(message = "Ingrese un correo válido, por ejemplo contacto@empresa.pe") @Size(max = 254) String correo,
    @Size(max = 250) String direccion) {
  @AssertTrue(message = "El DNI debe tener 8 dígitos y el RUC 11 dígitos")
  public boolean isDocumentoValido() {
    if (documento == null || tipoDocumento == null) return true;
    return switch (tipoDocumento) {
      case "DNI" -> documento.trim().matches("[0-9]{8}");
      case "RUC" -> documento.trim().matches("[0-9]{11}");
      default -> true;
    };
  }
}
