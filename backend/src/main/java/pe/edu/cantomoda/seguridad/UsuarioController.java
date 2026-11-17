package pe.edu.cantomoda.seguridad;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.cantomoda.common.exception.BusinessException;

@RestController
@RequestMapping("/api/v1/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {
  private final KeycloakAdminClient client;
  public UsuarioController(KeycloakAdminClient client) { this.client = client; }
  private static final Set<String> PERMITIDOS = Set.of("ADMIN", "SUPERVISOR", "VENDEDOR", "COMPRADOR");
  public record Crear(@NotBlank @Pattern(regexp="[a-zA-Z0-9._-]{3,80}") String username,
      @NotBlank @Size(min=12, max=128) String password, boolean enabled,
      @NotEmpty Set<@NotBlank String> roles,
      String firstName, String lastName, String email, Boolean temporaryPassword) {}
  public record Cambiar(boolean enabled, @NotEmpty Set<@NotBlank String> roles,
      String firstName, String lastName, String email) {}
  public record Usuario(String id, String username, boolean enabled, Set<String> roles,
      String firstName, String lastName, String email) {}

  private List<Map<String, Object>> validar(Set<String> roles) {
    if (!PERMITIDOS.containsAll(roles)) throw new BusinessException("Rol no permitido para la aplicación.");
    return roles.stream().sorted().map(client::rol).toList();
  }
  private Set<String> nombres(List<Map<String, Object>> roles) {
    var result = new TreeSet<String>();
    for (var r : roles) if (PERMITIDOS.contains(r.get("name"))) result.add(r.get("name").toString());
    return result;
  }
  @GetMapping
  public List<Usuario> listar(@RequestParam(defaultValue="0") @Min(0) int first,
      @RequestParam(defaultValue="20") @Min(1) @Max(100) int max,
      @RequestParam(required=false) String q) {
    return client.listar(first, max, q).stream().map(u -> new Usuario(
        u.get("id").toString(),
        u.get("username").toString(),
        Boolean.TRUE.equals(u.get("enabled")),
        nombres(client.roles(u.get("id").toString())),
        u.get("firstName") != null ? u.get("firstName").toString() : null,
        u.get("lastName") != null ? u.get("lastName").toString() : null,
        u.get("email") != null ? u.get("email").toString() : null
    )).toList();
  }
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Usuario crear(@Valid @RequestBody Crear r) {
    var roles = validar(r.roles());
    boolean temp = r.temporaryPassword() == null || Boolean.TRUE.equals(r.temporaryPassword());
    Map<String, Object> payload = new HashMap<>();
    payload.put("username", r.username());
    payload.put("enabled", false);
    payload.put("credentials", List.of(Map.of("type", "password", "value", r.password(), "temporary", temp)));
    if (r.firstName() != null && !r.firstName().isBlank()) payload.put("firstName", r.firstName().trim());
    if (r.lastName() != null && !r.lastName().isBlank()) payload.put("lastName", r.lastName().trim());
    if (r.email() != null && !r.email().isBlank()) payload.put("email", r.email().trim());

    String id = client.crear(payload);
    client.asignar(id, roles, false);
    client.actualizar(id, Map.of("enabled", r.enabled()));
    return new Usuario(id, r.username(), r.enabled(), r.roles(), r.firstName(), r.lastName(), r.email());
  }
  @PutMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void actualizar(@PathVariable @Pattern(regexp="[a-zA-Z0-9-]{1,100}") String id,
      @Valid @RequestBody Cambiar r, Authentication actor) {
    if (id.equals(actor.getName())) throw new BusinessException("No puede cambiar sus propios roles ni desactivar su cuenta.");
    var desired = validar(r.roles());
    var current = client.roles(id);
    var remove = current.stream().filter(x -> PERMITIDOS.contains(x.get("name")) && !r.roles().contains(x.get("name"))).toList();
    
    Map<String, Object> updateData = new HashMap<>();
    updateData.put("enabled", false);
    if (r.firstName() != null) updateData.put("firstName", r.firstName().trim());
    if (r.lastName() != null) updateData.put("lastName", r.lastName().trim());
    if (r.email() != null) updateData.put("email", r.email().trim());

    // Durante la reconciliación queda desactivada. Keycloak es externo: no existe rollback JPA.
    client.actualizar(id, updateData);
    client.cerrarSesiones(id);
    client.asignar(id, remove, true);
    client.asignar(id, desired, false);
    client.actualizar(id, Map.of("enabled", r.enabled()));
  }
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable @Pattern(regexp="[a-zA-Z0-9-]{1,100}") String id, Authentication actor) {
    if (id.equals(actor.getName())) throw new BusinessException("No puede eliminar su propia cuenta.");
    client.eliminar(id);
  }
}
