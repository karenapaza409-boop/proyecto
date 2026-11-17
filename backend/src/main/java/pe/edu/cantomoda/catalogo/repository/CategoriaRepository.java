package pe.edu.cantomoda.catalogo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.cantomoda.catalogo.entity.Categoria;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
  List<Categoria> findByActivoTrue(Sort sort);

  @Query("select c from Categoria c where (:activo is null or c.activo = :activo) and "
      + "(:q is null or lower(c.nombre) like lower(concat('%', :q, '%')) or (c.descripcion is not null and lower(c.descripcion) like lower(concat('%', :q, '%'))))")
  Page<Categoria> buscar(@Param("q") String q, @Param("activo") Boolean activo, Pageable pageable);

  @Query("select count(p) from Producto p where p.categoria.id = :categoriaId")
  long contarProductosPorCategoria(@Param("categoriaId") Long categoriaId);
}
