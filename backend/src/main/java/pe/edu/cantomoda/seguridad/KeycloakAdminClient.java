package pe.edu.cantomoda.seguridad;

import java.time.Duration;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.*;
import pe.edu.cantomoda.common.exception.*;

/** Cliente confidencial del backend. Nunca retorna tokens ni errores remotos al navegador. */
@Component
public class KeycloakAdminClient {
  private static final Logger log = LoggerFactory.getLogger(KeycloakAdminClient.class);
  private final RestClient http;
  private final String realm, clientId, secret;
  private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST = new ParameterizedTypeReference<>() {};

  @org.springframework.beans.factory.annotation.Autowired
  public KeycloakAdminClient(
      @Value("${cantomoda.keycloak-admin.url:http://localhost:38080}") String url,
      @Value("${cantomoda.keycloak-admin.realm:cantomoda}") String realm,
      @Value("${cantomoda.keycloak-admin.client-id:}") String clientId,
      @Value("${cantomoda.keycloak-admin.client-secret:}") String secret) {
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(3));
    factory.setReadTimeout(Duration.ofSeconds(5));
    this.http = RestClient.builder().baseUrl(url).requestFactory(factory).build();
    this.realm = realm; this.clientId = clientId; this.secret = secret;
  }

  KeycloakAdminClient(RestClient http, String realm, String clientId, String secret) {
    this.http = http; this.realm = realm; this.clientId = clientId; this.secret = secret;
  }

  private String token() {
    if (clientId.isBlank() || secret.isBlank())
      throw new ExternalServiceException("Administración Keycloak no configurada en el backend.");
    var form = new LinkedMultiValueMap<String, String>();
    form.add("grant_type", "client_credentials"); form.add("client_id", clientId); form.add("client_secret", secret);
    Map<?, ?> response = http.post().uri("/realms/{realm}/protocol/openid-connect/token", realm)
        .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Map.class);
    if (response == null || !(response.get("access_token") instanceof String value))
      throw new ExternalServiceException("Keycloak no devolvió una sesión administrativa válida.");
    return value;
  }
  private String base() { return "/admin/realms/" + realm; }
  private <T> T call(java.util.function.Function<String, T> action) {
    try { return action.apply(token()); }
    catch (HttpClientErrorException.Conflict e) { throw new BusinessException("La cuenta ya existe o tiene un conflicto."); }
    catch (RestClientException e) {
      log.error("Error en comunicación con Keycloak Admin API: {}", e.getMessage());
      throw new ExternalServiceException("No se pudo completar la administración en Keycloak. Consulte el estado antes de reintentar.");
    }
  }
  public List<Map<String, Object>> listar(int first, int max, String search) {
    return call(t -> {
      var uriBuilder = org.springframework.web.util.UriComponentsBuilder.fromPath(base() + "/users")
          .queryParam("first", first)
          .queryParam("max", max);
      if (search != null && !search.isBlank()) {
        uriBuilder.queryParam("search", search.trim());
      }
      return http.get().uri(uriBuilder.build().toUriString())
          .headers(h -> h.setBearerAuth(t)).retrieve().body(LIST);
    });
  }
  public List<Map<String, Object>> listar(int first, int max) {
    return listar(first, max, null);
  }
  public List<Map<String, Object>> roles(String id) {
    return call(t -> http.get().uri(base() + "/users/{id}/role-mappings/realm", id)
        .headers(h -> h.setBearerAuth(t)).retrieve().body(LIST));
  }
  public Map<String, Object> rol(String name) {
    return call(t -> {
      Map<String, Object> result = http.get().uri(base() + "/roles/{name}", name)
          .headers(h -> h.setBearerAuth(t)).retrieve().body(new ParameterizedTypeReference<Map<String, Object>>() {});
      if (result == null || Boolean.TRUE.equals(result.get("composite")))
        throw new BusinessException("Configure roles de aplicación simples, sin roles administrativos compuestos.");
      return result;
    });
  }
  public String crear(Map<String, Object> user) {
    return call(t -> {
      var response = http.post().uri(base() + "/users").headers(h -> h.setBearerAuth(t))
          .body(user).retrieve().toBodilessEntity();
      var location = response.getHeaders().getLocation();
      if (location == null) throw new ExternalServiceException("Cuenta creada; consulte Keycloak para completar su configuración.");
      String path = location.getPath();
      return path.substring(path.lastIndexOf('/') + 1);
    });
  }
  public void actualizar(String id, Map<String, Object> user) {
    call(t -> http.put().uri(base() + "/users/{id}", id).headers(h -> h.setBearerAuth(t))
        .body(user).retrieve().toBodilessEntity());
  }
  public void eliminar(String id) {
    call(t -> http.delete().uri(base() + "/users/{id}", id).headers(h -> h.setBearerAuth(t))
        .retrieve().toBodilessEntity());
  }
  public void cerrarSesiones(String id) {
    call(t -> http.post().uri(base() + "/users/{id}/logout", id).headers(h -> h.setBearerAuth(t))
        .retrieve().toBodilessEntity());
  }
  public void asignar(String id, List<Map<String, Object>> roles, boolean quitar) {
    if (roles.isEmpty()) return;
    call(t -> http.method(quitar ? HttpMethod.DELETE : HttpMethod.POST)
        .uri(base() + "/users/{id}/role-mappings/realm", id).headers(h -> h.setBearerAuth(t))
        .contentType(MediaType.APPLICATION_JSON).body(roles).retrieve().toBodilessEntity());
  }
}
