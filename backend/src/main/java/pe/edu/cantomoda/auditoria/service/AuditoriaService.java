package pe.edu.cantomoda.auditoria.service;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import pe.edu.cantomoda.auditoria.dto.AuditoriaResponse;
import pe.edu.cantomoda.auditoria.entity.RegistroAuditoria;
import pe.edu.cantomoda.auditoria.repository.RegistroAuditoriaRepository;
import pe.edu.cantomoda.common.dto.PageResponse;

@Service
@RequiredArgsConstructor
public class AuditoriaService {
  private final RegistroAuditoriaRepository repository;

  @Transactional(propagation = Propagation.MANDATORY)
  public void registrar(String actor, String accion, String entidad, Long id, String detalle) {
    RegistroAuditoria r = new RegistroAuditoria();
    r.setActor(actor);
    r.setAccion(accion);
    r.setEntidad(entidad);
    r.setEntidadId(id);
    r.setFecha(LocalDateTime.now());
    r.setDetalle(detalle);
    repository.save(r);
  }

  @Transactional(readOnly = true)
  public PageResponse<AuditoriaResponse> listar(int page, int size) {
    return listar(null, null, null, null, null, page, size);
  }

  @Transactional(readOnly = true)
  public PageResponse<AuditoriaResponse> listar(
      LocalDate desde, LocalDate hasta, String usuario, String modulo, String accion, int page, int size) {
    Specification<RegistroAuditoria> spec = (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (desde != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("fecha"), desde.atStartOfDay()));
      }
      if (hasta != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("fecha"), hasta.plusDays(1).atStartOfDay()));
      }
      if (usuario != null && !usuario.isBlank() && !"Todos".equalsIgnoreCase(usuario)) {
        predicates.add(cb.equal(cb.lower(root.get("actor")), usuario.trim().toLowerCase()));
      }
      if (modulo != null && !modulo.isBlank() && !"Todos".equalsIgnoreCase(modulo)) {
        predicates.add(cb.equal(cb.lower(root.get("entidad")), modulo.trim().toLowerCase()));
      }
      if (accion != null && !accion.isBlank() && !"Todas".equalsIgnoreCase(accion)) {
        predicates.add(cb.equal(cb.lower(root.get("accion")), accion.trim().toLowerCase()));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };

    return PageResponse.of(
        repository
            .findAll(
                spec,
                PageRequest.of(
                    Math.max(0, page),
                    Math.clamp(size, 1, 100),
                    Sort.by(Sort.Direction.DESC, "fecha").and(Sort.by(Sort.Direction.DESC, "id"))))
            .map(
                r ->
                    new AuditoriaResponse(
                        r.getId(),
                        r.getActor(),
                        r.getAccion(),
                        r.getEntidad(),
                        r.getEntidadId(),
                        r.getFecha(),
                        r.getDetalle())));
  }
}
