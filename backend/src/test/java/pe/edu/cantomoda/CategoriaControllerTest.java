package pe.edu.cantomoda;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import pe.edu.cantomoda.catalogo.controller.CategoriaController;
import pe.edu.cantomoda.catalogo.dto.CategoriaResponse;
import pe.edu.cantomoda.catalogo.service.CategoriaService;
import pe.edu.cantomoda.common.dto.PageResponse;

class CategoriaControllerTest {
  @Test
  void buscarUsaLaRutaYFiltrosDeLaPantallaSinInterpretarlosComoUnId() throws Exception {
    var service = mock(CategoriaService.class);
    when(service.buscar("", true, 0, 20)).thenReturn(new PageResponse<>(
        List.of(new CategoriaResponse(1L, "Polos", null, true, 2L)), 0, 20, 1L, 1));
    when(service.buscar("Polos", false, 0, 20))
        .thenReturn(new PageResponse<>(List.of(), 0, 20, 0L, 0));
    var mvc = MockMvcBuilders.standaloneSetup(new CategoriaController(service)).build();
    mvc.perform(get("/api/v1/categorias/buscar").param("q", "")
            .param("activo", "true").param("page", "0").param("size", "20"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].nombre").value("Polos"));
    mvc.perform(get("/api/v1/categorias/buscar").param("q", "Polos").param("activo", "false"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    verify(service).buscar("", true, 0, 20);
    verify(service).buscar("Polos", false, 0, 20);
  }
}
