# Pruebas y sustentación

## Casos incluidos en el backend

FlujoIntegracionTest usa Spring Boot completo, MockMvc y base H2 en modo Oracle. No simula repositorios ni servicios. TestJwtConfig proporciona claves RSA solo de test. OracleEndToEndIT hereda los mismos casos con Oracle real cuando se ejecuta -Poracle-it verify.

1. Compra de 10, venta de 2, consulta, anulación, segundo intento rechazado y auditoría con dos actores.
2. Venta de dos productos: el segundo sin stock revierte también el descuento del primero y no crea cabecera.
3. Detalles vacíos, nulos o con elemento null: 400.
4. Sin token: 401; rol insuficiente: 403.
5. Vendedor solo ve sus operaciones; otro vendedor no obtiene la venta por ID.
6. Tres ventas paginadas de una en una; agregado total de las tres permanece correcto.
7. Anular compra después de consumir parte del stock: 409 sin cambios parciales.
8. Cantidad inválida y producto repetido rechazados.
9. Reporte vacío con ceros y ordenamiento inválido rechazado.
10. Categoría inexistente: 404.
11. CORS permitido/bloqueado.
12. Cache-Control de categorías y respuesta con X-Trace-ID.
13. Token RS256 firmado realmente con clave de prueba: acceso permitido; roles efectivos; firma inválida rechazada.
14. ModularityTests verifica límites de módulos.

Frontend: concurrencia de renovación, limpieza tras rechazo del proveedor, payload de venta sin precio/total/actor, rechazo de líneas vacías y duplicadas.

E2E Playwright: login Keycloak → categoría → producto → proveedor → compra → venta → anulación → stock → auditoría. No contiene mocks HTTP. Se incluye como prueba ejecutable; consultar VALIDACION.md para saber si se ejecutó en este entorno.

## Demostración manual

| Paso | Evidencia que debes capturar en tu equipo |
|---|---|
| Entorno y arranque | java/javac 21, Maven Wrapper, Node, Docker Compose, salud Oracle y backend |
| API | Swagger y petición válida/inválida con respuesta HTTP |
| CRUD | Crear/editar/eliminar una categoría y un producto relacionado |
| Stock | Compra de 10 → venta de 2 → anulación → 10 |
| Rollback | Dos líneas, segunda sin stock, sin cambios parciales en Oracle |
| Identidad | Login Keycloak, usuarios de roles diferentes y F5 |
| Acceso | 401 sin token, 403 por rol y renovación una sola vez |
| Reporte | Filtros, cambio de página, total global filtrado invariable |
| Auditoría | CREAR y ANULAR con actor real, fecha y entidad |
| Optimización | Builds dev/prod, Network mostrando chunks, caché de categorías |
| Producción local | Compose de producción, API sin Swagger y health público |
| Estabilización | Explicar un hallazgo de BITACORA y ejecutar su prueba de regresión |

Usar capturas auténticas del propio equipo con reloj y perfil visibles, como piden las sesiones. Adjuntar salida real de tests y commits. No se incluyen capturas simuladas, resultados Oracle inventados ni evidencias de defensa inexistente.

## Preguntas para defender

- ¿Por qué un monolito modular y un pom.xml son suficientes?
- ¿Por qué ventas no importa el repositorio ni la entidad interna de catálogo?
- ¿Cómo se representa el muchos a muchos y por qué el detalle tiene su propia entidad?
- ¿Qué dato impide que el cliente decida el precio o suplante al vendedor?
- ¿Qué revierte una transacción cuando falla la segunda línea?
- ¿Por qué anular no es borrar ni volver a descontar al cambiar de estado?
- ¿Por qué 401 puede renovarse y 403 no debe hacerlo?
- ¿Por qué el total del reporte no se calcula sumando solo la página visible?
- ¿Qué prueba H2 no puede demostrar sobre Oracle o Keycloak?
- ¿Qué se midió para decidir que Redis no es necesario en este alcance?

Documentar la asignación real de integrantes antes de la entrega académica. No atribuirse ejecuciones ni aportes que no se hayan realizado.
