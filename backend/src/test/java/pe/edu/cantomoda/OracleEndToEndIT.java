package pe.edu.cantomoda;

import org.springframework.test.context.ActiveProfiles;

// Real Oracle. JWT principal injected by Spring Security Test, as in S14.
// No mocks of services/repositories. Do not run against business data.
@ActiveProfiles("oracle-it")
class OracleEndToEndIT extends FlujoBase {}
