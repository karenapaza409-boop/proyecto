package pe.edu.cantomoda;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
@org.springframework.context.annotation.Import(TestJwtConfig.class)
class ClienteIntegracionTest {
 @Autowired MockMvc mvc; @Autowired JdbcTemplate jdbc; @Autowired tools.jackson.databind.ObjectMapper json;
 org.springframework.test.web.servlet.request.RequestPostProcessor admin(){return jwt().jwt(j->j.subject("cliente-admin-prueba")).authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));}
 String data(String dni){return "{\"tipoDocumento\":\"DNI\",\"documento\":\""+dni+"\",\"nombres\":\"Ana Maria\",\"apellidos\":\"Torres Prueba\"}";}
 @Test void creaEditaBuscaPaginasYRechazaDuplicados()throws Exception {
  String dni=String.format("%08d",java.util.concurrent.ThreadLocalRandom.current().nextInt(100000000));
  var result=mvc.perform(post("/api/v1/clientes").with(admin()).contentType(MediaType.APPLICATION_JSON).content(data(dni)))
   .andExpect(status().isCreated()).andExpect(jsonPath("$.nombre").value("Ana Maria Torres Prueba")).andExpect(jsonPath("$.telefono").isEmpty()).andReturn();
  long id=json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
  mvc.perform(put("/api/v1/clientes/"+id).with(admin()).contentType(MediaType.APPLICATION_JSON).content(data(dni).replace("Ana Maria","Ana Rosa").replace("}",",\"telefono\":\"+51 999 000 000\",\"correo\":\"cliente@example.test\"}")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.nombres").value("Ana Rosa"));
  mvc.perform(get("/api/v1/clientes/"+id).with(admin())).andExpect(status().isOk()).andExpect(jsonPath("$.apellidos").value("Torres Prueba")).andExpect(jsonPath("$.correo").value("cliente@example.test"));
  for(String q:java.util.List.of(dni,"Ana Rosa")) mvc.perform(get("/api/v1/clientes/buscar").with(admin()).param("q",q).param("size","1"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id));
  mvc.perform(post("/api/v1/clientes").with(admin()).contentType(MediaType.APPLICATION_JSON).content(data(dni))).andExpect(status().isConflict()).andExpect(jsonPath("$.duplicadoId").value(id));
  assertThatThrownBy(()->jdbc.update("INSERT INTO MM_VENTAS.CLIENTES(nombre,documento,tipo_documento,activo) VALUES(?,?,?,1)","Duplicado ficticio",dni,"DNI")).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM MM_AUDITORIA.REGISTROS WHERE entidad='CLIENTES' AND entidad_id=?",Long.class,id)).isEqualTo(2);
 }
 @Test void validaDniContactoNombresYPermisos()throws Exception {
  mvc.perform(get("/api/v1/clientes/buscar")).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/v1/clientes").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_VENDEDOR"))).contentType(MediaType.APPLICATION_JSON).content(data("00000000"))).andExpect(status().isForbidden());
  mvc.perform(post("/api/v1/clientes").with(admin()).contentType(MediaType.APPLICATION_JSON).content(data("123"))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.documento").exists());
  mvc.perform(post("/api/v1/clientes").with(admin()).contentType(MediaType.APPLICATION_JSON).content(data("00000000").replace("Ana Maria","  "))).andExpect(status().isBadRequest());
  mvc.perform(post("/api/v1/clientes").with(admin()).contentType(MediaType.APPLICATION_JSON).content(data("00000000").replace("}",",\"correo\":\"incorrecto\"}"))).andExpect(status().isBadRequest());
  mvc.perform(get("/api/v1/clientes/buscar").with(admin()).param("q","Sin coincidencias "+java.util.UUID.randomUUID()).param("page","1").param("size","1"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0)).andExpect(jsonPath("$.number").value(1));
 }
}
