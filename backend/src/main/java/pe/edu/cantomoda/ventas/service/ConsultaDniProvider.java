package pe.edu.cantomoda.ventas.service;

/** Implementar únicamente con el contrato y credenciales de un proveedor autorizado.
 * Las implementaciones deben usar timeout y no registrar DNI, tokens ni respuestas completas.
 */
public interface ConsultaDniProvider {
  Persona consultar(String dni);
  record Persona(String nombres, String apellidoPaterno, String apellidoMaterno) {}
}
