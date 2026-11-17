package pe.edu.cantomoda.auditoria.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pe.edu.cantomoda.auditoria.entity.RegistroAuditoria;

public interface RegistroAuditoriaRepository
    extends JpaRepository<RegistroAuditoria, Long>, JpaSpecificationExecutor<RegistroAuditoria> {}
