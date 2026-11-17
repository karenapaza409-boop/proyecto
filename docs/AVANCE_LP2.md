# Trazabilidad con las sesiones y evaluaciones

| Sesión | Contenido aplicado | Archivos/evidencia |
|---|---|---|
| S01 | Backend REST, ambientes, Oracle, OpenAPI, módulos | backend/pom.xml; application*.yml; database/; common/config; ModularityTests |
| S02 | CRUD, DTO, validaciones, mappers y errores | catalogo; GlobalExceptionHandler; FlujoIntegracionTest |
| S03 | Categoría–Producto, DTO relacionado y navegación controlada | Producto, ProductoMapper, ProductoRepository; filtro categoriaId |
| S04 | Cabecera–detalle, cálculos, regla de stock y transacción atómica | VentaService, CompraService, ProductoService; pruebas de rollback |
| S05 | Filtros, orden, proyecciones/agregados, CORS y correlación | repositorios de ventas/compras; resumen; CorsConfigurationSource; CorrelationIdFilter |
| S06 | Backend integrado y defensa U1 | PRUEBAS_Y_SUSTENTACION.md; casos funcionales y prueba con Oracle |
| S07 | SPA, core/shared/features, layout, rutas y CRUD independiente | app.routes.ts; core/layout; shared/master-list y master-form |
| S08 | CRUD dependiente y selección de categorías | features/catalogo/producto-form y producto-list |
| S09 | FormArray, cálculo computed, confirmación, reporte y anulación | shared/operacion-form y operacion-list; PATCH anular |
| S10 | Contratos de roles/JWT y preparación del reemplazo | API_Y_SEGURIDAD.md; matriz RBAC; prueba RSA. Implementación propia temporal sustituida en el estado final |
| S10b | Reemplazo por Keycloak | keycloak/cantomoda-realm.json; compose.yml; SecurityConfig |
| S11 | PKCE, guards, sesión, renovación 401, logout y menú por rol | core/services/auth-service; interceptor; guards; e2e/cantomoda.spec.ts |
| S12 | SPA segura y sustentación individual | Matriz U2 abajo; demo manual y E2E |
| S13 | Lazy loading, code splitting, caché, logs, salud y producción | OPTIMIZACION.md; logs de build; Dockerfile; compose.prod.yml; logback-spring.xml |
| S14 | Paginación, agregados, auditoría, integración y estabilización | DTO PageResponse; repositorios; AuditoriaService; OracleEndToEndIT; BITACORA.md |
| S15 | Producto final y sustentación | Toda la documentación; lista de comprobación y evidencias pendientes |
| S16 | Defensa individual acumulada | Preguntas de defensa y explicación del aporte propio |

## Unidad I

Demostrar CRUD válido y errores 400/404; relación de categoría; una venta con varias líneas; fallo de segunda línea y rollback; filtros combinados; agregados cero; CORS permitido/bloqueado y trazabilidad X-Trace-ID. El código y la prueba H2 no reemplazan la ejecución contra Oracle exigida para la evidencia final.

## Unidad II

Demostrar navegación y CRUD en la SPA, formulario dependiente, transacción con múltiples líneas, consulta/reporte, login real Keycloak, F5 conservando sesión, renovación de token y permisos con al menos dos usuarios diferentes. El login recoge la contraseña en Keycloak; la pantalla administrativa nueva permite al ADMIN definir una contraseña temporal al crear una cuenta, sin persistirla en el navegador. No presentar el JWT de test como si fuera un login real.

Si el proyecto es grupal, cada integrante debe presentar su módulo transaccional propio. Este alcance ofrece ventas y compras; categoría o login por separado no constituyen un módulo cabecera–detalle propio. Antes de asignar más integrantes deben definirse sus aportes con el docente. No se inventaron módulos adicionales sin conocer el número de integrantes.

## Unidad III

La rúbrica tiene cuatro criterios de 25%: optimización/caché/observabilidad/despliegue; paginación/integración; auditoría/E2E/estabilización; sustentación. No se asigna una nota anticipada. La defensa, los commits de cada alumno y las evidencias en vivo se producen por el equipo, no se fabrican en este ZIP.

Las guías completas se enlazan en FUENTES.md. Las decisiones arquitectónicas prevalecen sobre los nombres de sesiones desalineados que tenía la documentación anterior.
