package pe.edu.cantomoda.common.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String id = req.getHeader("X-Trace-ID");
    if (id == null || !id.matches("[a-zA-Z0-9-]{1,64}")) id = UUID.randomUUID().toString();
    MDC.put("traceId", id);
    res.setHeader("X-Trace-ID", id);
    long start = System.nanoTime();
    try {
      chain.doFilter(req, res);
    } finally {
      LoggerFactory.getLogger(getClass())
          .info(
              "method={} path={} status={} durationMs={}",
              req.getMethod(),
              req.getRequestURI(),
              res.getStatus(),
              (System.nanoTime() - start) / 1_000_000);
      MDC.remove("traceId");
    }
  }
}
