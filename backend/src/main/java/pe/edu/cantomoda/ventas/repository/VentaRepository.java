package pe.edu.cantomoda.ventas.repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import pe.edu.cantomoda.ventas.dto.VentaAgregado;
import pe.edu.cantomoda.ventas.entity.Venta;

public interface VentaRepository extends JpaRepository<Venta, Long> {
  Optional<Venta> findByClaveOperacion(String claveOperacion);
  String FILTROS =
      " from Venta v left join v.cliente c where (:estado is null or v.estado=:estado) and (:desde is null or"
          + " v.fecha>=:desde) and (:hasta is null or v.fecha<:hasta) and (:actor is null or"
          + " v.actor=:actor) and (:texto is null or lower(c.nombre) like :texto escape '!' or str(v.id)=:numero)";

  @Query("select v" + FILTROS)
  Page<Venta> buscar(
      @Param("estado") String estado,
      @Param("desde") LocalDateTime desde,
      @Param("hasta") LocalDateTime hasta,
      @Param("actor") String actor,
      @Param("texto") String texto, @Param("numero") String numero,
      Pageable pageable);

  @EntityGraph(attributePaths = {"cliente", "detalles"})
  @Query("select distinct v" + FILTROS + " order by v.fecha desc, v.id desc")
  List<Venta> listarParaExportar(
      @Param("estado") String estado,
      @Param("desde") LocalDateTime desde,
      @Param("hasta") LocalDateTime hasta,
      @Param("actor") String actor,
      @Param("texto") String texto,
      @Param("numero") String numero);

  @Query(
      "select new pe.edu.cantomoda.ventas.dto.VentaAgregado(count(v),coalesce(sum(v.total),0BD))"
          + FILTROS)
  VentaAgregado agregado(
      @Param("estado") String estado,
      @Param("desde") LocalDateTime desde,
      @Param("hasta") LocalDateTime hasta,
      @Param("actor") String actor, @Param("texto") String texto, @Param("numero") String numero);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select v from Venta v where v.id=:id")
  Optional<Venta> bloquear(@Param("id") Long id);
}
