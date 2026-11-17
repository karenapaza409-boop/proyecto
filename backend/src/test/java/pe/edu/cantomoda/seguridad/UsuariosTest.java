package pe.edu.cantomoda.seguridad;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.context.annotation.Import(pe.edu.cantomoda.TestJwtConfig.class)
class UsuariosTest {
  @Autowired MockMvc mvc;
  @MockitoBean KeycloakAdminClient client;
  private org.springframework.test.web.servlet.request.RequestPostProcessor user(String role) {
    return jwt().jwt(j -> j.subject("admin-test")).authorities(new SimpleGrantedAuthority("ROLE_" + role));
  }
  @Test void accesoDenegadoSinRolAdministrativo() throws Exception {
    mvc.perform(get("/api/v1/usuarios")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/usuarios").with(user("VENDEDOR"))).andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/usuarios").with(user("SUPERVISOR")).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"test\",\"password\":\"ficticia-test-2026\",\"roles\":[\"ADMIN\"]}"))
        .andExpect(status().isForbidden());
    verifyNoInteractions(client);
  }
  @Test void rechazaAutoCambioYRolesAjenos() throws Exception {
    mvc.perform(put("/api/v1/usuarios/admin-test").with(user("ADMIN")).contentType(MediaType.APPLICATION_JSON)
        .content("{\"enabled\":false,\"roles\":[\"ADMIN\"]}"))
        .andExpect(status().isConflict());
    mvc.perform(post("/api/v1/usuarios").with(user("ADMIN")).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"test\",\"password\":\"ficticia-test-2026\",\"enabled\":true,\"roles\":[\"realm-admin\"]}"))
        .andExpect(status().isConflict());
    verifyNoInteractions(client);
  }
  @Test void creaDesactivadaYAsignaVariosRolesAntesDeActivar() throws Exception {
    var vendedor = Map.<String,Object>of("id", "r1", "name", "VENDEDOR");
    var comprador = Map.<String,Object>of("id", "r2", "name", "COMPRADOR");
    when(client.rol("VENDEDOR")).thenReturn(vendedor);
    when(client.rol("COMPRADOR")).thenReturn(comprador);
    when(client.crear(anyMap())).thenAnswer(inv -> {
      Map<?,?> body = inv.getArgument(0);
      org.assertj.core.api.Assertions.assertThat(body.get("enabled")).isEqualTo(false);
      return "nuevo-test";
    });
    mvc.perform(post("/api/v1/usuarios").with(user("ADMIN")).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"test\",\"password\":\"ficticia-test-2026\",\"enabled\":true,\"roles\":[\"VENDEDOR\",\"COMPRADOR\"]}"))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.roles.length()").value(2))
        .andExpect(jsonPath("$.password").doesNotExist());
    var order = inOrder(client);
    order.verify(client).crear(anyMap());
    order.verify(client).asignar("nuevo-test", List.of(comprador, vendedor), false);
    order.verify(client).actualizar("nuevo-test", Map.of("enabled", true));
  }
  @Test void falloAsignacionNoActivaCuenta() throws Exception {
    when(client.rol("VENDEDOR")).thenReturn(Map.of("name", "VENDEDOR"));
    when(client.crear(anyMap())).thenReturn("nuevo-test");
    doThrow(new pe.edu.cantomoda.common.exception.ExternalServiceException("Servicio no disponible"))
        .when(client).asignar(eq("nuevo-test"), anyList(), eq(false));
    mvc.perform(post("/api/v1/usuarios").with(user("ADMIN")).contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"test\",\"password\":\"ficticia-test-2026\",\"enabled\":true,\"roles\":[\"VENDEDOR\"]}"))
        .andExpect(status().isServiceUnavailable());
    verify(client, never()).actualizar(anyString(), anyMap());
  }
}
