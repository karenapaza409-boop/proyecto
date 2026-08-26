package pe.edu.upeu.asistencia.academico.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pe.edu.upeu.asistencia.academico.dto.EstudianteResponse;
import pe.edu.upeu.asistencia.academico.service.EstudianteService;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EstudianteController.class)
class EstudianteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EstudianteService estudianteService;

    @Test
    void debeListarEstudiantesCorrectamente() throws Exception {
        EstudianteResponse estudiante = new EstudianteResponse(1L, "20230101", "Juan Pérez");
        given(estudianteService.listarTodos()).willReturn(List.of(estudiante));

        mockMvc.perform(get("/api/v1/academico/estudiantes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").value("20230101"))
                .andExpect(jsonPath("$[0].nombre").value("Juan Pérez"));
    }
}