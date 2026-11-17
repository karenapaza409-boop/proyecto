package pe.edu.cantomoda.compras.service;

import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.transaction.annotation.Propagation;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.common.exception.BusinessException;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.compras.exception.ProveedorDuplicadoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cantomoda.common.exception.NotFoundException;
import pe.edu.cantomoda.compras.dto.*;
import pe.edu.cantomoda.compras.entity.Proveedor;
import pe.edu.cantomoda.compras.mapper.ProveedorMapper;
import pe.edu.cantomoda.compras.repository.ProveedorRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProveedorService {
  private final ProveedorRepository repository;
  private final ProveedorMapper mapper;
  private final AuditoriaService auditoria;

  public List<ProveedorResponse> listar() {
    return repository.findByActivoTrue(Sort.by("nombre").and(Sort.by("id"))).stream()
        .map(mapper::response)
        .toList();
  }

  public PageResponse<ProveedorResponse> buscar(String q, Boolean activo, int page, int size) {
    String pattern = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase(Locale.ROOT)
        .replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    return PageResponse.of(repository.buscar(pattern, activo,
        PageRequest.of(Math.max(0, page), Math.clamp(size, 1, 100), Sort.by("nombre").and(Sort.by("id")))).map(mapper::response));
  }

  public ProveedorResponse obtener(Long id) {
    return mapper.response(entity(id));
  }

  private Proveedor entity(Long id) {
    return repository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));
  }

  private Proveedor bloquear(Long id) {
    return repository.bloquear(id).orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));
  }

  @Transactional(propagation = Propagation.MANDATORY)
  public Proveedor paraCompra(Long id) {
    Proveedor p = bloquear(id);
    if (!p.isActivo()) throw new BusinessException("El proveedor está inactivo. Seleccione otro proveedor para la nueva compra.");
    return p;
  }

  public ProveedorResponse duplicado(String tipo, String documento, Long excluir) {
    if (tipo == null || !Set.of("DNI", "RUC").contains(tipo) || documento == null)
      throw new IllegalArgumentException("Tipo y documento requeridos");
    return repository.duplicados(tipo, documento.trim(), excluir).stream().findFirst().map(mapper::response).orElse(null);
  }

  private void validarDuplicado(ProveedorRequest r, Long excluir) {
    var p = duplicado(r.tipoDocumento(), r.documento(), excluir);
    if (p != null) throw new ProveedorDuplicadoException(p.id());
  }

  @Transactional
  public ProveedorResponse crear(ProveedorRequest r, String actor) {
    validarDuplicado(r, null);
    Proveedor e = new Proveedor();
    mapper.apply(e, r);
    repository.saveAndFlush(e);
    auditoria.registrar(actor, "CREAR", "PROVEEDOR", e.getId(), "Proveedor registrado; estado=ACTIVO");
    return mapper.response(e);
  }

  @Transactional
  public ProveedorResponse actualizar(Long id, ProveedorRequest r, String actor) {
    Proveedor e = bloquear(id);
    validarDuplicado(r, id);
    var antes = mapper.response(e);
    mapper.apply(e, r);
    var despues = mapper.response(e);
    List<String> campos = new ArrayList<>();
    if (!Objects.equals(antes.nombre(), despues.nombre())) campos.add("nombre");
    if (!Objects.equals(antes.documento(), despues.documento())) campos.add("documento");
    if (!Objects.equals(antes.tipoDocumento(), despues.tipoDocumento())) campos.add("tipoDocumento");
    if (!Objects.equals(antes.nombreComercial(), despues.nombreComercial())) campos.add("nombreComercial");
    if (!Objects.equals(antes.personaContacto(), despues.personaContacto())) campos.add("personaContacto");
    if (!Objects.equals(antes.telefono(), despues.telefono())) campos.add("telefono");
    if (!Objects.equals(antes.correo(), despues.correo())) campos.add("correo");
    if (!Objects.equals(antes.direccion(), despues.direccion())) campos.add("direccion");
    repository.flush();
    if (!campos.isEmpty()) auditoria.registrar(actor, "ACTUALIZAR", "PROVEEDOR", id, "Campos modificados: " + String.join(", ", campos));
    return despues;
  }

  @Transactional
  public ProveedorResponse estado(Long id, boolean activo, String actor) {
    Proveedor p = bloquear(id);
    if (p.isActivo() != activo) {
      p.setActivo(activo);
      auditoria.registrar(actor, activo ? "ACTIVAR" : "DESACTIVAR", "PROVEEDOR", id,
          activo ? "estado=INACTIVO -> ACTIVO" : "estado=ACTIVO -> INACTIVO");
    }
    return mapper.response(p);
  }

  @Transactional
  public void eliminar(Long id, String actor) {
    Proveedor e = entity(id);
    repository.delete(e);
    repository.flush();
    auditoria.registrar(actor, "ELIMINAR", "PROVEEDOR", id, "Eliminación de proveedor");
  }
}
