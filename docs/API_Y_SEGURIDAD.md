# API y seguridad

Base: /api/v1. Todos los endpoints de negocio requieren token Bearer válido. Respuestas de error ProblemDetail con detail; 400 validación, 401 sin token/vencido, 403 sin permiso, 404 inexistente y 409 conflicto de negocio o integridad.

| Recurso | Endpoints |
|---|---|
| Categorías, clientes y proveedores | GET colección, GET /{id}, POST, PUT /{id}, DELETE /{id} |
| Productos | GET paginado con q/categoriaId/page/size; GET /{id}; POST; PUT /{id}; DELETE /{id} |
| Ventas y compras | GET paginado; GET /resumen; GET /{id}; POST; PATCH /{id}/anular |
| Auditoría | GET paginado |

Proveedores tiene ahora endpoints específicos de búsqueda paginada, duplicados, estado e historial. Su DELETE de compatibilidad desactiva, sin borrar. Los contratos y permisos detallados están en `PROVEEDORES.md`. El historial respeta las compras propias de COMPRADOR; las nuevas compras rechazan proveedores inactivos también en el backend.

Ventas/compras aceptan estado, desde, hasta (YYYY-MM-DD), page, size, ordenarPor (fecha/id/total) y direccion (ASC/DESC). El rango incluye el día hasta completo mediante límite exclusivo del día siguiente. El resumen usa los mismos filtros, sin límite de página.

## Contratos

Venta: `{"clienteId":null,"detalles":[{"productoId":1,"cantidad":2}]}`.

Compra: `{"proveedorId":1,"detalles":[{"productoId":1,"cantidad":10,"precioUnitario":1.20}]}`.

No se aceptan precios de venta ni stock como campos editables del cliente; tampoco actor, total ni estado de la transacción. El registro de compras corresponde a productos ya recibidos. No hay órdenes pendientes ni recepciones parciales en este alcance.

La respuesta paginada contiene content, number, size, totalElements y totalPages. Se utiliza DTO propio para evitar depender del formato interno de serialización de PageImpl. El resumen devuelve cantidad, total y promedio. Sin resultados: ceros, no null.

## Matriz de acceso

| Acción | ADMIN | SUPERVISOR | VENDEDOR | COMPRADOR |
|---|---|---|---|---|
| Consultar catálogo y datos maestros | Sí | Sí | Sí | Sí |
| Crear/editar/eliminar maestros | Sí | No | No | No |
| Registrar venta | Sí | Sí | Sí | No |
| Consultar ventas | Todas | Todas | Propias | No |
| Registrar compra | Sí | Sí | No | Sí |
| Consultar compras | Todas | Todas | No | Propias |
| Anular venta/compra | Sí | Sí | No | No |
| Auditoría | Sí | Sí | No | No |

## Identidad

Keycloak emite JWT RS256 con realm_access.roles. El backend usa Resource Server y valida firma, expiración y issuer; en contenedores, jwk-set-uri apunta al hostname interno y issuer conserva el hostname público de los tokens.

El login de la SPA usa Authorization Code + PKCE S256, state y nonce; la contraseña de inicio de sesión se ingresa en Keycloak. Los tokens viven en memoria con copia en sessionStorage, nunca localStorage. El guard renueva una sesión vencida antes de entrar; el interceptor renueva una vez ante 401 y solo reintenta una vez. Un 403 se muestra sin cerrar sesión ni refrescar. Las renovaciones concurrentes comparten la misma promesa. El logout se envía al endpoint de Keycloak.

El actor de ventas, compras y auditoría se lee del sub del token verificado, no del request. El nombre visible se toma de las claims de identidad; el actor persistido es el identificador estable del usuario.

S10 enseñó JWT propio como etapa temporal; el estado final de S10b/S11 lo reemplaza. Por eso no hay un segundo sistema propio de contraseñas ni un AuthController activo en esta entrega. Las claves RSA de las pruebas son solo de test y nunca se incluyen en producción.

CORS lee orígenes desde configuración. No se utiliza como sustituto de autenticación. Pruebas cubren preflight permitido y rechazado; la comprobación en navegador real se deja en la guía manual.

## Extensiones de esta revisión

`POST /api/v1/clientes/consulta-dni` recibe `dni` como cadena de ocho dígitos. Solo ADMIN. Sin proveedor autorizado configurado, responde ProblemDetail 503 y permite conservar el ingreso manual. La integración se conecta implementando ConsultaDniProvider; no hay URL remota por defecto.

`GET /api/v1/usuarios?first=0&max=20`, `POST /api/v1/usuarios` y `PUT /api/v1/usuarios/{id}` exigen ADMIN. La creación recibe username, password temporal (12–128 caracteres), enabled y una colección roles. La actualización recibe enabled y roles; nunca acepta cambiar la propia cuenta. Solo se permiten ADMIN, SUPERVISOR, VENDEDOR y COMPRADOR, con al menos uno. La respuesta de usuario no contiene password ni tokens.

La pantalla administrativa permite ingresar una contraseña temporal exclusivamente para crear una cuenta y la vacía al finalizar. No almacena esa contraseña en sessionStorage. El secreto del cliente confidencial y sus tokens de administración permanecen en backend. La configuración ausente o una falla remota retorna 503 sin exponer respuestas internas. Una cuenta creada o reconciliada a medias queda desactivada; las llamadas a Keycloak no son una transacción Oracle.

Los cambios administrativos deben quedar en Admin Events de Keycloak, cuya activación está pendiente en el servicio real. Cerrar sesiones invalida su renovación; los JWT emitidos siguen sujetos a su propia expiración. No se afirma revocación instantánea de access tokens por un Resource Server JWT local.
