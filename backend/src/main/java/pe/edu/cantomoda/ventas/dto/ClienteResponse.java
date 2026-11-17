package pe.edu.cantomoda.ventas.dto;

public record ClienteResponse(
    Long id,
    String nombre,
    String documento,
    String tipoDocumento,
    String telefono,
    String correo,
    boolean activo, String nombres, String apellidos) {}
