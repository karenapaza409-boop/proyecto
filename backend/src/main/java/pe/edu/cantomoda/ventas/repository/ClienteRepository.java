package pe.edu.cantomoda.ventas.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.cantomoda.ventas.entity.Cliente;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
  @Query("select c from Cliente c where (:activo is null or c.activo=:activo) and "
      + "(:q is null or lower(c.nombre) like :q escape '!' or c.documento like :q escape '!')")
  Page<Cliente> buscar(String q, Boolean activo, Pageable pageable);

  @Query("select c from Cliente c where trim(c.documento)=:documento and "
      + "(:tipo is null or c.tipoDocumento is null or c.tipoDocumento=:tipo) and (:excluir is null or c.id<>:excluir) order by c.id")
  List<Cliente> duplicados(String tipo, String documento, Long excluir);
}
