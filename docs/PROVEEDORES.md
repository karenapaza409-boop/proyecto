# Proveedores: uso, API y migración

Actualización del 8 de noviembre de 2026. Alcance: proveedores y su conexión con compras. Se mantienen Keycloak, los roles existentes, el monolito modular y los estilos oscuros. No hay consultas externas ni campos de deudas, pagos o condiciones comerciales sin implementar.

Diseño visual actualizado siguiendo el boceto aportado: filtros compactos con Limpiar, tabla con Ver ficha y menú de acciones, paginación por rango, tarjetas separadas de identificación/contacto y acciones al pie del formulario. No se copiaron los datos de ejemplo ni los números de anotación del boceto a la aplicación. Se mantiene el menú general del sistema y el control de acceso existente.

## Incidencia resuelta: alta guardada pero listado con error 400

El backend que estaba ejecutándose aún publicaba el contrato anterior: solo nombre/documento y rutas colección/{id}. La SPA nueva llamaba a `/proveedores/buscar`, que el backend antiguo intentaba interpretar como un ID y rechazaba. Una conexión de diagnóstico a Oracle confirmó además que faltaba la columna ACTIVO de la migración.

Se identificó el proceso Maven de este mismo proyecto, se ejecutó el preflight en FREEPDB1 sin detectar duplicados, se detuvo únicamente su backend y se aplicó la migración aditiva. Los conteos fueron 3 proveedores antes y después y 0 compras antes y después. Los 3 tipos de documento se conservaron NULL, sin clasificar automáticamente. Se reinició el backend actualizado y su OpenAPI ya publica búsqueda, estado, duplicados e historial. `ProveedorOracleLecturaIT` comprobó la consulta sin filtros contra Oracle real, sin insertar fixtures ni modificar registros.

El listado ahora diferencia un fallo de consulta de un resultado vacío y ofrece Reintentar listado. Se añadió una prueba de regresión sin filtros y una prueba de interfaz de error/reintento. Angular: 19 pruebas aprobadas y build production correcto. No se ejecutó un alta ficticia sobre los datos reales ni se afirma que se completara todo el E2E autenticado. Las referencias a migración pendiente en los apartados históricos siguientes corresponden a la revisión anterior.

## Uso

`/proveedores` permite buscar por razón social/nombre, nombre comercial o documento; filtrar activos/inactivos/todos y paginar. Cada fila muestra documento, nombre, teléfono, estado y acceso a la ficha. Solo ADMIN puede registrar, editar y activar/desactivar.

`/proveedores/nuevo` y `/proveedores/{id}/editar` usan un formulario propio con Identificación y Contacto. Tipo, número y razón social/nombre son obligatorios; nombre comercial y todos los datos de contacto son opcionales. Se admiten DNI de 8 dígitos y RUC de 11; se valida formato, no identidad ni vigencia tributaria. No se infieren tipos por longitud ni se hacen consultas a terceros.

Las ayudas y errores tienen asociaciones accesibles; los errores aparecen después de tocar el campo o intentar guardar. Los fallos de guardado conservan los datos. Durante la solicitud se bloquean los campos y el segundo envío. Ante un documento duplicado, se muestra el error del número y un enlace a la ficha existente para ADMIN, incluso si el proveedor está inactivo. El éxito ofrece listado, ficha y compra preseleccionada según permisos/estado.

La ficha muestra datos reales de contacto e historial de compras paginado, con productos, importes y estados existentes. La última compra se consulta en la base sobre todo el historial autorizado, incluyendo anuladas; no se calcula a partir de una página. ADMIN/SUPERVISOR ven todas las compras; COMPRADOR solo las propias, igual que en el módulo de compras. Otros usuarios autenticados pueden leer los datos generales, pero no el historial restringido ni iniciar compras sin el rol adecuado.

`Nueva compra` abre `/compras/nueva?proveedorId={id}`. La compra busca proveedores activos con paginación, admite cargar más y conserva la selección al buscar. La preselección consulta el ID por separado, por lo que funciona aunque no esté en la primera página. Si se desactiva entre la consulta y el guardado, el backend rechaza la compra. Se conserva la compra histórica y su FK; no se eliminan proveedores.

## Backend y contratos

| Endpoint | Uso y permisos |
|---|---|
| GET /api/v1/proveedores/buscar?q=&activo=&page=0&size=20 | Listado paginado autenticado; activo omitido significa todos; tamaño máximo 100 |
| GET /api/v1/proveedores/{id} | Ficha general autenticada, incluidos inactivos |
| GET /api/v1/proveedores/duplicado?tipoDocumento=DNI&documento=…&excluirId=… | Detección de duplicados, solo ADMIN; también detecta un registro anterior sin tipo con el mismo documento |
| POST /api/v1/proveedores | Registro ADMIN, estado inicial activo; respuesta 201 |
| PUT /api/v1/proveedores/{id} | Edición ADMIN, conserva el estado |
| PUT /api/v1/proveedores/{id}/estado | ADMIN; cuerpo con activo booleano obligatorio |
| GET /api/v1/proveedores/{id}/historial?page=0&size=10 | Compras y última fecha autorizadas; roles de compra |
| GET /api/v1/proveedores | Contrato anterior de arreglo conservado, ahora solo activos; las pantallas nuevas usan buscar paginado |
| DELETE /api/v1/proveedores/{id} | Compatibilidad: desactiva y responde 204, nunca borra físicamente |

El DTO de escritura mantiene `nombre` y `documento` y añade `tipoDocumento`, `nombreComercial`, `personaContacto`, `telefono`, `correo` y `direccion`. El servidor valida tipo/formato, longitudes, correo y teléfono. Campos opcionales vacíos se guardan como NULL. La respuesta añade `activo`. Errores de validación de proveedores incluyen `errors` por campo; duplicados detectados por el servicio incluyen `duplicadoId`. La restricción de base protege también las carreras entre solicitudes; la interfaz puede consultar el duplicado tras un 409 de integridad.

`ProveedorService` valida y bloquea el proveedor al editar, cambiar estado o usarlo en una compra. `CompraService` adquiere ese bloqueo dentro de su transacción antes de modificar stock. La activación/desactivación y una compra concurrente quedan ordenadas por la misma fila: si la desactivación confirma primero, la nueva compra se rechaza.

La auditoría existente registra CREAR, ACTUALIZAR, ACTIVAR y DESACTIVAR sobre PROVEEDOR con el `sub` de Keycloak. En una edición se registran los nombres de los campos modificados; no se copian teléfono/correo/dirección a logs o auditoría. Las escrituras de proveedor y auditoría participan en la misma transacción.

## Esquema: aplicación sobre una base existente

**Aplicar antes de arrancar el backend actualizado.** No se ejecutó esta migración sobre Oracle en esta sesión: no hay Docker disponible ni listener Oracle local detectado. No se conoce el número real de duplicados de la base del usuario. Las comprobaciones de H2 no certifican el SQL Oracle.

La migración añade siete columnas a MM_COMPRAS.PROVEEDORES: TIPO_DOCUMENTO, NOMBRE_COMERCIAL, PERSONA_CONTACTO, TELEFONO, CORREO, DIRECCION y ACTIVO. Tipo y contacto quedan NULL en los registros existentes. ACTIVO recibe 1 porque antes todos podían usarse en compras; conserva ese comportamiento, no inventa información de identificación.

Se añaden checks de estado y formato para documentos clasificados, un índice único sobre tipo/documento normalizado y un índice de compras por proveedor/fecha/ID. La unicidad anterior de DOCUMENTO se conserva; con DNI/RUC de longitudes distintas no impide combinaciones válidas admitidas. No se borra ninguna restricción, tabla, esquema, fila o volumen.

1. Detener el backend y disponer de un respaldo conforme al procedimiento de la base. Oracle confirma DDL implícitamente: una falla posterior no revierte columnas ya añadidas. Mantener el backend detenido durante toda la aplicación.
2. Desde la raíz, ejecutar `docker compose up -d oracle` para incorporar el montaje de solo lectura `database/migrations`. Esto conserva el volumen existente. Esperar a que Oracle esté disponible.
3. Ejecutar diagnóstico de solo lectura:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrar-proveedores.ps1
```

`03_proveedores_preflight.sql` detecta grupos con el mismo tipo y documento normalizado con TRIM. En una base anterior sin columna tipo, todos se revisan como sin clasificar. Si la columna ya existe, comprueba también el formato de los registros clasificados. Ante conflicto se detiene con error; no elimina ni fusiona. Para localizar grupos anteriores sin exponer números en un log compartido, un responsable puede consultar localmente:

```sql
SELECT MIN(id) AS id_referencia, COUNT(*) AS registros
FROM MM_COMPRAS.PROVEEDORES
GROUP BY TRIM(documento)
HAVING COUNT(*) > 1;
```

La resolución de cualquier conflicto requiere revisión humana sobre los documentos reales. No agregar un tipo ficticio para superar el diagnóstico.

4. Si el diagnóstico es correcto, aplicar:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrar-proveedores.ps1 -Aplicar
```

`04_proveedores.sql` vuelve a ejecutar el preflight **antes** del DDL y añade solo elementos ausentes. Se puede repetir después de revisar un fallo; no sustituye un historial de migraciones ni un respaldo. El índice UQ_PROV_TIPO_DOC_NORM protege tipo/documento con TRIM y distingue los antiguos sin clasificar sin modificar sus datos. El check de formato permite NULL exclusivamente para conservar esos datos anteriores; la API exige DNI/RUC en registros nuevos o editados.

5. Revisar metadatos y arrancar el backend con `ddl-auto=validate`. Verificar proveedores anteriores, sus compras y un alta ficticia con contacto. No usar `down -v` ni ejecutar limpiezas para resolver errores.

Para Oracle sin Docker, ejecutar ambos scripts desde su carpeta con SQL*Plus conectado a FREEPDB1 como cuenta de mantenimiento autorizada, empezando por `@03_proveedores_preflight.sql` y después `@04_proveedores.sql`. No pasar contraseñas en argumentos ni documentación. En una instalación nueva, `01-init.sh` ejecuta la migración después del SQL inicial; el proveedor de ejemplo conserva el tipo sin clasificar.

## Verificación

- `ProveedorIntegracionTest` usa MockMvc, servicios, repositorios y transacciones reales con H2 en modo Oracle: alta/edición, contacto opcional, duplicados incluso inactivos, unicidad de base, permisos/validaciones, registros anteriores sin tipo, búsqueda/estado/paginación, baja con historia conservada y rechazo de nuevas compras, última fecha e historial por propietario.
- Las pruebas Angular verifican errores diferidos, DNI/RUC, contacto opcional, datos conservados, enlace al duplicado, doble envío y compra preseleccionada por ID. También cubren el rechazo de un proveedor inactivo.
- `npm run test:proveedores:ui` usa Edge headless y levanta Angular en 127.0.0.1:4300. Intercepta la API y usa datos ficticios explícitos, sin modificar el código de autenticación. Verifica formulario, confirmación, compra preseleccionada, historial y desactivación. No acredita login real ni persistencia Oracle. Requiere Edge instalado.
- `npm run test:e2e` sigue reservado al recorrido real con Keycloak/Oracle y credenciales de prueba, con las etiquetas de proveedor actualizadas. No se mezcla con la suite UI interceptada.

Resultados finales y evidencias: `pruebas-y-pendientes.md`. Pendientes reales: aplicar y repetir la migración en Oracle de pruebas, comprobar su preflight con duplicados ficticios deliberados, validar arranque con esquema real y ejecutar el E2E autenticado sin interceptar API.
