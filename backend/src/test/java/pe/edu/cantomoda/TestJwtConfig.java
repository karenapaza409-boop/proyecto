package pe.edu.cantomoda;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/** Test-only RSA key. Production validates the keys published by Keycloak. */
@TestConfiguration(proxyBeanMethods = false)
public class TestJwtConfig {
  static final KeyPair KEYS = keys();

  private static KeyPair keys() {
    try {
      var generator = KeyPairGenerator.getInstance("RSA");
      generator.initialize(2048);
      return generator.generateKeyPair();
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }

  @Bean
  JwtDecoder decoder() {
    return NimbusJwtDecoder.withPublicKey((RSAPublicKey) KEYS.getPublic()).build();
  }
}
