package pe.edu.cantomoda.catalogo.repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import pe.edu.cantomoda.catalogo.entity.Producto;

public interface ProductoRepository extends JpaRepository<Producto, Long>, JpaSpecificationExecutor<Producto> {
  @EntityGraph(attributePaths = "categoria")
  @Query(
      "select p from Producto p where (:categoriaId is null or p.categoria.id=:categoriaId) and (:q"
          + " is null or lower(p.nombre) like lower(concat('%',:q,'%')) or lower(p.codigo) like"
          + " lower(concat('%',:q,'%')) or p.codigoBarras like concat('%',:q,'%')) and (:estado is null or (:estado='SIN_STOCK' and p.stock=0) or (:estado='BAJO' and p.stock>0 and p.stockMinimo is not null and p.stock<=p.stockMinimo) or (:estado='DISPONIBLE' and p.stock>0 and (p.stockMinimo is null or p.stock>p.stockMinimo)))")
  Page<Producto> buscar(
      @Param("categoriaId") Long categoriaId, @Param("q") String q, @Param("estado") String estado, Pageable pageable);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Producto p where p.id=:id")
  Optional<Producto> bloquear(@Param("id") Long id);

  @EntityGraph(attributePaths = "categoria")
  Optional<Producto> findByCodigoIgnoreCase(String codigo);

  @EntityGraph(attributePaths = "categoria")
  Optional<Producto> findByCodigoBarrasIgnoreCase(String codigoBarras);

  @Query("select p.codigo from Producto p where upper(p.codigo) like concat(:prefijo, '-%')")
  List<String> buscarCodigosPorPrefijo(@Param("prefijo") String prefijo);

  @Query(value = "SELECT COUNT(*) FROM MM_COMPRAS.DETALLES_COMPRA WHERE producto_id = :id", nativeQuery = true)
  long contarComprasPorProducto(@Param("id") Long id);

  @Query(value = "SELECT COUNT(*) FROM MM_VENTAS.DETALLES_VENTA WHERE producto_id = :id", nativeQuery = true)
  long contarVentasPorProducto(@Param("id") Long id);
}
