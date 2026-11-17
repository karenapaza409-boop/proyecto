package pe.edu.cantomoda.ventas.dto;

import jakarta.validation.constraints.*;

public record ClienteRequest(
    @Size(max = 150) String nombre,
    @NotBlank(message = "Ingrese el número de documento") @Size(max = 20) String documento,
    @NotBlank(message = "Seleccione el tipo de documento") @Pattern(regexp = "DNI", message = "Por el momento se admite DNI") String tipoDocumento,
    @Size(max = 30) @Pattern(regexp = "(?:\\s*|\\+?[0-9][0-9 () .-]{5,29})", message = "Ingrese un teléfono válido") String telefono,
    @Email(message = "Ingrese un correo válido, por ejemplo cliente@correo.com") @Size(max = 254) String correo,
    @Size(max=75) String nombres, @Size(max=75) String apellidos) {
  public ClienteRequest(String nombre,String documento,String tipoDocumento,String telefono,String correo) {
    this(nombre,documento,tipoDocumento,telefono,correo,null,null);
  }
  @AssertTrue(message="Ingrese nombres y apellidos; el nombre completo admite hasta 150 caracteres")
  public boolean isIdentidadValida() {
    if(nombres==null && apellidos==null) return nombre!=null && !nombre.isBlank();
    return nombres!=null && !nombres.isBlank() && apellidos!=null && !apellidos.isBlank()
      && (nombres.trim()+" "+apellidos.trim()).length()<=150;
  }
  @AssertTrue(message = "El DNI debe tener exactamente 8 dígitos")
  public boolean isDocumentoValido() {
    if (documento == null || tipoDocumento == null) return true;
    if ("DNI".equalsIgnoreCase(tipoDocumento)) {
      return documento.trim().matches("^[0-9]{8}$");
    }
    return true;
  }
}
