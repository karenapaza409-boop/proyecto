package pe.edu.upeu.asistencia.academico.service;

import pe.edu.upeu.asistencia.academico.model.ReconocimientoFacial;

import java.util.List;

public interface ReconocimientoFacialService {

    List<ReconocimientoFacial> listarTodos();

    ReconocimientoFacial buscarPorId(Long id);

    ReconocimientoFacial buscarPorIdentificador(String identificadorFacial);

    ReconocimientoFacial registrar(ReconocimientoFacial reconocimiento);

    ReconocimientoFacial actualizar(Long id, ReconocimientoFacial reconocimiento);

    void eliminar(Long id);
}