package pe.edu.cantomoda.compras.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import pe.edu.cantomoda.compras.entity.Proveedor;

public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
  List<Proveedor> findByActivoTrue(Sort sort);
  @Query("select p from Proveedor p where (:activo is null or p.activo=:activo) and "
      + "(:q is null or lower(p.nombre) like :q escape '!' or lower(p.nombreComercial) like :q escape '!' or p.documento like :q escape '!')")
  Page<Proveedor> buscar(String q, Boolean activo, Pageable pageable);
  @Query("select p from Proveedor p where trim(p.documento)=:documento and "
      + "(p.tipoDocumento=:tipo or p.tipoDocumento is null) and (:excluir is null or p.id<>:excluir) order by p.id")
  List<Proveedor> duplicados(String tipo, String documento, Long excluir);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Proveedor p where p.id=:id")
  Optional<Proveedor> bloquear(Long id);
}
