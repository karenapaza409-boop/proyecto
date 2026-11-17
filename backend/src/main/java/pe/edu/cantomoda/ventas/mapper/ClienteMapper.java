package pe.edu.cantomoda.ventas.mapper;

import org.springframework.stereotype.Component;
import pe.edu.cantomoda.ventas.dto.*;
import pe.edu.cantomoda.ventas.entity.Cliente;

@Component
public class ClienteMapper {
  public void apply(Cliente e, ClienteRequest r) {
    if(r.nombres()!=null && r.apellidos()!=null) {
      e.setNombres(r.nombres().trim()); e.setApellidos(r.apellidos().trim());
      e.setNombre(e.getNombres()+" "+e.getApellidos());
    } else {
      if(!java.util.Objects.equals(e.getNombre(),r.nombre().trim())) { e.setNombres(null); e.setApellidos(null); }
      e.setNombre(r.nombre().trim());
    }
    e.setDocumento(r.documento().trim());
    e.setTipoDocumento(r.tipoDocumento() != null && !r.tipoDocumento().isBlank() ? r.tipoDocumento().trim().toUpperCase() : "DNI");
    e.setTelefono(r.telefono() != null && !r.telefono().isBlank() ? r.telefono().trim() : null);
    e.setCorreo(r.correo() != null && !r.correo().isBlank() ? r.correo().trim().toLowerCase() : null);
  }

  public ClienteResponse response(Cliente e) {
    return new ClienteResponse(
        e.getId(),
        e.getNombre(),
        e.getDocumento(),
        e.getTipoDocumento(),
        e.getTelefono(),
        e.getCorreo(),
        e.isActivo(), e.getNombres(), e.getApellidos()
    );
  }
}
