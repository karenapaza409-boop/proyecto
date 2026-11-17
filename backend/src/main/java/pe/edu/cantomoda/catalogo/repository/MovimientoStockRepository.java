package pe.edu.cantomoda.catalogo.repository;
import pe.edu.cantomoda.catalogo.entity.MovimientoStock;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import java.time.LocalDateTime;
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock,Long> {
  @Query("select m from MovimientoStock m where m.producto.id=:producto and (:desde is null or m.fecha>=:desde) and (:hasta is null or m.fecha<:hasta) and (:tipo is null or m.tipo=:tipo)")
  Page<MovimientoStock> buscar(Long producto, LocalDateTime desde,LocalDateTime hasta,String tipo,Pageable page);
  @Query("select count(m) from MovimientoStock m where m.producto.id = :productoId and m.tipo <> 'SALDO_INICIAL'")
  long contarOperacionesPorProductoId(@org.springframework.data.repository.query.Param("productoId") Long productoId);

  @Modifying
  @Query("delete from MovimientoStock m where m.producto.id = :productoId and m.tipo = 'SALDO_INICIAL'")
  void eliminarSaldoInicialPorProductoId(@org.springframework.data.repository.query.Param("productoId") Long productoId);
}
