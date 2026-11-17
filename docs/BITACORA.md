# Bitácora de adaptación y estabilización

| Hallazgo en la referencia | Corrección en el cantomoda | Regresión |
|---|---|---|
| Dominios de computadoras/ensamblaje y módulos fuera del alcance | Retirados; catálogo, ventas, compras y auditoría propios del cantomoda | Inventario de archivos y revisión de rutas |
| Compras conservaba líneas en localStorage | Entidad, tabla, DTO compuesto, total y persistencia transaccional en Oracle | Compra/venta/stock y OracleEndToEndIT |
| Cambio CONFIRMADO → ENTREGADO podía descontar otra vez | Operación creada REGISTRADA y solo transición explícita ANULADA; sin PUT de estados arbitrarios | Segundo intento de anulación 409, stock invariable |
| DELETE no restauraba stock | Eliminación de transacciones sustituida por anulación con reversión | Compra/venta/anulación/auditoría |
| API aceptaba cabecera sin detalles | NotEmpty, validación en cascada y rechazo de productos duplicados | Vacíos/null/duplicados |
| Pruebas omitían el servicio de stock | Prueba con servicios y repositorios reales, persistencia transaccional | Fallo de segunda línea revierte el primero |
| Seguridad propia y permisos generales | Keycloak Resource Server y matriz de roles por operación | 401/403, pertenencia de ventas, firma RS256 de test |
| Listados completos | Paginación y agregado separado con filtros comunes | Total independiente de la página |
| Auditoría manual | Registro automático en la misma transacción y actor del JWT | CREAR/ANULAR de actores distintos |
| Configuración CORS no detectada inicialmente en pruebas | Bean nombrado corsConfigurationSource para integración con Spring Security | Preflight permitido y bloqueado |
| Caché de categorías podía mostrar lista anterior tras guardar | Revisión de URL invalidada tras escrituras de la SPA y TTL privado breve | Revisión del flujo CRUD |

Consultar VALIDACION.md para distinguir pruebas ejecutadas de comprobaciones que requieren Oracle/Keycloak/Docker. Las entradas de esta bitácora describen cambios reales de código; no son una declaración de que ya se haya sustentado el proyecto.
