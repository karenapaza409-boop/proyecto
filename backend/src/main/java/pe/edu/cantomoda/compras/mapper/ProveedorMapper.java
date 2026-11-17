package pe.edu.cantomoda.compras.mapper;

import org.springframework.stereotype.Component;
import pe.edu.cantomoda.compras.dto.*;
import pe.edu.cantomoda.compras.entity.Proveedor;

@Component
public class ProveedorMapper {
  public void apply(Proveedor e, ProveedorRequest r) {
    e.setNombre(r.nombre().trim());
    e.setDocumento(r.documento().trim());
    e.setTipoDocumento(r.tipoDocumento());
    e.setNombreComercial(optional(r.nombreComercial()));
    e.setPersonaContacto(optional(r.personaContacto()));
    e.setTelefono(optional(r.telefono()));
    e.setCorreo(optional(r.correo()));
    e.setDireccion(optional(r.direccion()));
  }

  private String optional(String value) { return value == null || value.isBlank() ? null : value.trim(); }

  public ProveedorResponse response(Proveedor e) {
    return new ProveedorResponse(e.getId(), e.getNombre(), e.getDocumento(), e.getTipoDocumento(),
        e.getNombreComercial(), e.getPersonaContacto(), e.getTelefono(), e.getCorreo(), e.getDireccion(), e.isActivo());
  }
}
