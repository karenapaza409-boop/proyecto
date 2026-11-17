package pe.edu.cantomoda.ventas;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import pe.edu.cantomoda.auditoria.service.AuditoriaService;
import pe.edu.cantomoda.ventas.dto.ClienteRequest;
import pe.edu.cantomoda.ventas.dto.ClienteResponse;
import pe.edu.cantomoda.ventas.entity.Cliente;
import pe.edu.cantomoda.ventas.exception.ClienteDuplicadoException;
import pe.edu.cantomoda.ventas.exception.ClienteInactivoException;
import pe.edu.cantomoda.ventas.mapper.ClienteMapper;
import pe.edu.cantomoda.ventas.repository.ClienteRepository;
import pe.edu.cantomoda.ventas.service.ClienteService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class ClienteServiceTest {

  static class FakeClienteRepo implements ClienteRepository {
    Long idSeq = 1L;
    List<Cliente> storage = new java.util.ArrayList<>();

    @Override
    public List<Cliente> duplicados(String tipo, String documento, Long excluir) {
      return storage.stream()
          .filter(c -> c.getDocumento().equals(documento.trim()) && (excluir == null || !c.getId().equals(excluir)))
          .toList();
    }

    @Override
    public org.springframework.data.domain.Page<Cliente> buscar(String q, Boolean activo, Pageable pageable) {
      return new PageImpl<>(storage);
    }

    @Override
    public <S extends Cliente> S save(S entity) {
      if (entity.getId() == null) entity.setId(idSeq++);
      storage.removeIf(c -> c.getId().equals(entity.getId()));
      storage.add(entity);
      return entity;
    }

    @Override public Optional<Cliente> findById(Long id) { return storage.stream().filter(c -> c.getId().equals(id)).findFirst(); }
    @Override public List<Cliente> findAll(org.springframework.data.domain.Sort sort) { return storage; }
    @Override public void delete(Cliente entity) { storage.remove(entity); }
    @Override public void flush() {}
    @Override public List<Cliente> findAll() { return storage; }
    @Override public List<Cliente> findAllById(Iterable<Long> ids) { return Collections.emptyList(); }
    @Override public <S extends Cliente> List<S> saveAll(Iterable<S> entities) { return Collections.emptyList(); }
    @Override public boolean existsById(Long id) { return findById(id).isPresent(); }
    @Override public long count() { return storage.size(); }
    @Override public void deleteById(Long id) {}
    @Override public void deleteAllById(Iterable<? extends Long> ids) {}
    @Override public void deleteAll(Iterable<? extends Cliente> entities) {}
    @Override public void deleteAll() {}
    @Override public <S extends Cliente> List<S> saveAllAndFlush(Iterable<S> entities) { return Collections.emptyList(); }
    @Override public <S extends Cliente> S saveAndFlush(S entity) { return save(entity); }
    @Override public void deleteAllInBatch(Iterable<Cliente> entities) {}
    @Override public void deleteAllByIdInBatch(Iterable<Long> ids) {}
    @Override public void deleteAllInBatch() {}
    @Override public Cliente getOne(Long id) { return null; }
    @Override public Cliente getById(Long id) { return null; }
    @Override public Cliente getReferenceById(Long id) { return null; }
    @Override public <S extends Cliente> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
    @Override public <S extends Cliente> List<S> findAll(org.springframework.data.domain.Example<S> example) { return Collections.emptyList(); }
    @Override public <S extends Cliente> List<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Sort sort) { return Collections.emptyList(); }
    @Override public <S extends Cliente> org.springframework.data.domain.Page<S> findAll(org.springframework.data.domain.Example<S> example, Pageable pageable) { return org.springframework.data.domain.Page.empty(); }
    @Override public <S extends Cliente> long count(org.springframework.data.domain.Example<S> example) { return 0; }
    @Override public <S extends Cliente> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
    @Override public <S extends Cliente, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
    @Override public org.springframework.data.domain.Page<Cliente> findAll(Pageable pageable) { return new PageImpl<>(storage); }
  }

  static class FakeAuditoriaService extends AuditoriaService {
    public FakeAuditoriaService() { super(null); }
    @Override public void registrar(String actor, String accion, String entidad, Long id, String detalle) {}
  }

  @Test
  void testFlujoCompletoCliente() {
    var repo = new FakeClienteRepo();
    var mapper = new ClienteMapper();
    var auditoria = new FakeAuditoriaService();
    var service = new ClienteService(repo, mapper, auditoria);

    // 1. Crear
    var req = new ClienteRequest("Carlos Mendoza", "12345678", "DNI", "999888777", "carlos@correo.com");
    ClienteResponse creado = service.crear(req, "admin");
    assertNotNull(creado.id());
    assertEquals("Carlos Mendoza", creado.nombre());
    assertEquals("12345678", creado.documento());
    assertEquals("999888777", creado.telefono());
    assertEquals("carlos@correo.com", creado.correo());

    // 2. Rechazar duplicado
    assertThrows(ClienteDuplicadoException.class, () -> {
      service.crear(new ClienteRequest("Otro", "12345678", "DNI", null, null), "admin");
    });

    // 3. Editar
    var editReq = new ClienteRequest("Carlos M. Ramos", "12345678", "DNI", "999000111", "carlos.nuevo@correo.com");
    ClienteResponse editado = service.actualizar(creado.id(), editReq, "admin");
    assertEquals("Carlos M. Ramos", editado.nombre());
    assertEquals("999000111", editado.telefono());

    // 4. Buscar
    var busqueda = service.buscar("Mendoza", null, 0, 10);
    assertFalse(busqueda.content().isEmpty());
  }

  @Test
  void testResolverOCrearReutilizaExistenteYRechazaInactivo() {
    var repo = new FakeClienteRepo();
    var mapper = new ClienteMapper();
    var auditoria = new FakeAuditoriaService();
    var service = new ClienteService(repo, mapper, auditoria);

    // 1. Crear automáticamente cliente nuevo
    Cliente c1 = service.resolverOCrear("DNI", "73231090", "Brayan Roy Estofanero", "admin");
    assertNotNull(c1.getId());
    assertEquals("73231090", c1.getDocumento());
    assertEquals("Brayan Roy Estofanero", c1.getNombre());
    assertTrue(c1.isActivo());

    // 2. Reutilizar existente sin duplicar
    Cliente c2 = service.resolverOCrear("DNI", " 73231090 ", "Otro Nombre", "admin");
    assertEquals(c1.getId(), c2.getId());
    assertEquals("Brayan Roy Estofanero", c2.getNombre());
    assertEquals(1, repo.storage.size());

    // 3. Si se desactiva, debe arrojar ClienteInactivoException
    c1.setActivo(false);
    assertThrows(ClienteInactivoException.class, () -> {
      service.resolverOCrear("DNI", "73231090", "Cualquiera", "admin");
    });

    // 4. Al reactivarlo, vuelve a permitir resolverlo
    ClienteResponse reactivado = service.reactivar(c1.getId(), "admin");
    assertTrue(reactivado.activo());
    Cliente c3 = service.resolverOCrear("DNI", "73231090", null, "admin");
    assertEquals(c1.getId(), c3.getId());
    assertTrue(c3.isActivo());
  }
}
