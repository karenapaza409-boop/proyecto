package pe.edu.cantomoda.ventas.service;

import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.common.dto.PageResponse;
import pe.edu.cantomoda.common.exception.NotFoundException;
import pe.edu.cantomoda.ventas.dto.*;
import pe.edu.cantomoda.ventas.entity.Cliente;
import pe.edu.cantomoda.ventas.exception.ClienteDuplicadoException;
import pe.edu.cantomoda.ventas.exception.ClienteInactivoException;
import pe.edu.cantomoda.ventas.mapper.ClienteMapper;
import pe.edu.cantomoda.ventas.repository.ClienteRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClienteService {
  private final ClienteRepository repository;
  private final ClienteMapper mapper;
  private final AuditoriaService auditoria;

  public List<ClienteResponse> listar() {
    return repository.findAll(Sort.by("nombre")).stream()
        .map(mapper::response)
        .toList();
  }

  public PageResponse<ClienteResponse> buscar(String q, Boolean activo, int page, int size) {
    String pattern = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase(Locale.ROOT)
        .replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    return PageResponse.of(repository.buscar(pattern, activo,
        PageRequest.of(Math.max(0, page), Math.clamp(size, 1, 100), Sort.by("nombre").and(Sort.by("id")))).map(mapper::response));
  }

  public ClienteResponse obtener(Long id) {
    return mapper.response(entity(id));
  }

  public ClienteResponse duplicado(String tipoDocumento, String documento, Long excluirId) {
    if (documento == null || documento.isBlank()) return null;
    var dupes = repository.duplicados(null, documento.trim(), excluirId);
    return dupes.isEmpty() ? null : mapper.response(dupes.get(0));
  }

  public Cliente entity(Long id) {
    return repository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));
  }

  @Transactional
  public Cliente resolverOCrear(String tipo, String documento, String nombre, String actor) {
    if (documento == null || documento.isBlank()) return null;
    String doc = documento.trim();
    String tipoDoc = tipo != null && !tipo.isBlank() ? tipo.trim().toUpperCase() : "DNI";

    synchronized (("CLI_SYNC:" + doc).intern()) {
      var existentes = repository.duplicados(null, doc, null);
      if (!existentes.isEmpty()) {
        Cliente c = existentes.get(0);
        if (!c.isActivo()) {
          throw new ClienteInactivoException(c.getId(), c.getNombre(), c.getDocumento());
        }
        return c;
      }

      try {
        Cliente nuevo = new Cliente();
        String nom = nombre != null && !nombre.isBlank() && !nombre.equalsIgnoreCase("Consumidor final")
            ? nombre.trim()
            : "Cliente " + tipoDoc + " " + doc;
        nuevo.setNombre(nom);
        nuevo.setDocumento(doc);
        nuevo.setTipoDocumento(tipoDoc);
        nuevo.setActivo(true);
        Cliente guardado = repository.saveAndFlush(nuevo);
        auditoria.registrar(actor, "CREAR", "CLIENTES", guardado.getId(), "Registro de cliente al confirmar venta");
        return guardado;
      } catch (DataIntegrityViolationException ex) {
        var dupes = repository.duplicados(null, doc, null);
        if (!dupes.isEmpty()) {
          Cliente c = dupes.get(0);
          if (!c.isActivo()) {
            throw new ClienteInactivoException(c.getId(), c.getNombre(), c.getDocumento());
          }
          return c;
        }
        throw ex;
      }
    }
  }

  @Transactional
  public ClienteResponse reactivar(Long id, String actor) {
    Cliente e = entity(id);
    e.setActivo(true);
    Cliente guardado = repository.saveAndFlush(e);
    auditoria.registrar(actor, "REACTIVAR", "CLIENTES", id, "Reactivación de cliente");
    return mapper.response(guardado);
  }

  @Transactional
  public ClienteResponse crear(ClienteRequest r, String actor) {
    validarUnicidad(r.tipoDocumento(), r.documento(), null);
    Cliente e = new Cliente();
    mapper.apply(e, r);
    Cliente guardado = repository.saveAndFlush(e);
    auditoria.registrar(actor, "CREAR", "CLIENTES", guardado.getId(), "Registro de cliente");
    return mapper.response(guardado);
  }

  @Transactional
  public ClienteResponse actualizar(Long id, ClienteRequest r, String actor) {
    validarUnicidad(r.tipoDocumento(), r.documento(), id);
    Cliente e = entity(id);
    mapper.apply(e, r);
    Cliente guardado = repository.saveAndFlush(e);
    auditoria.registrar(actor, "ACTUALIZAR", "CLIENTES", guardado.getId(), "Actualización de identificación/contacto del cliente");
    return mapper.response(guardado);
  }

  private void validarUnicidad(String tipoDocumento, String documento, Long excluirId) {
    if (documento == null) return;
    var dupes = repository.duplicados(null, documento.trim(), excluirId);
    if (!dupes.isEmpty()) {
      throw new ClienteDuplicadoException(dupes.get(0).getId());
    }
  }

  @Transactional
  public void eliminar(Long id, String actor) {
    Cliente e = entity(id);
    repository.delete(e);
    repository.flush();
    auditoria.registrar(actor, "ELIMINAR", "CLIENTES", id, "Eliminación de cliente");
  }
}
