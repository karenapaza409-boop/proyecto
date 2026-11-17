package pe.edu.cantomoda.compras.repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import pe.edu.cantomoda.compras.dto.CompraAgregado;
import pe.edu.cantomoda.compras.entity.Compra;

public interface CompraRepository extends JpaRepository<Compra, Long> {
  @Query("select v from Compra v where v.proveedor.id=:proveedor and (:actor is null or v.actor=:actor)")
  Page<Compra> historialProveedor(Long proveedor, String actor, Pageable pageable);
  @Query("select max(v.fecha) from Compra v where v.proveedor.id=:proveedor and (:actor is null or v.actor=:actor)")
  LocalDateTime ultimaCompraProveedor(Long proveedor, String actor);
  String FILTROS =
      " from Compra v where (:estado is null or v.estado=:estado) and (:desde is null or"
          + " v.fecha>=:desde) and (:hasta is null or v.fecha<:hasta) and (:actor is null or"
          + " v.actor=:actor)";

  @Query("select v" + FILTROS)
  Page<Compra> buscar(
      @Param("estado") String estado,
      @Param("desde") LocalDateTime desde,
      @Param("hasta") LocalDateTime hasta,
      @Param("actor") String actor,
      Pageable pageable);

  @Query(
      "select new pe.edu.cantomoda.compras.dto.CompraAgregado(count(v),coalesce(sum(v.total),0BD))"
          + FILTROS)
  CompraAgregado agregado(
      @Param("estado") String estado,
      @Param("desde") LocalDateTime desde,
      @Param("hasta") LocalDateTime hasta,
      @Param("actor") String actor);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select v from Compra v where v.id=:id")
  Optional<Compra> bloquear(@Param("id") Long id);
}
