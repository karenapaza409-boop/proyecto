package pe.edu.cantomoda;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTests {
  @Test
  void modulosRespetanSusLimites() {
    ApplicationModules.of(CantoModaApplication.class).verify();
  }
}
