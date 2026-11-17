# Cambios — 8 de noviembre de 2026

## Clientes esenciales, sin ficha

Se conservaron las pantallas y cambios de clientes existentes, completando el guardado separado de nombres/apellidos, la edición sin separación supuesta del nombre histórico, el fallback DNI, la detección de duplicados y los mensajes/guardas de envío. Se preservaron los roles, auditoría y contrato nombre usado por ventas. Migración aditiva 08 aplicada conservando 1 cliente; no hubo altas ficticias en la base real. No se añadió ficha ni historial. Detalles: CLIENTES-ESENCIAL.md.

## Productos e inventario según boceto

Catálogo con filtros por categoría/stock y búsqueda por código de barras; formulario con barras, unidad y mínimo; ficha con movimientos, merma y conteo físico. El stock se mantiene protegido por bloqueo y los movimientos se escriben en la misma transacción de compras/ventas/anulaciones. Los ajustes requieren motivo, permisos y coincidencia del stock leído. Se agregaron pruebas de saldo, rollback, duplicados y filtros.

Migración 06 aplicada en Oracle local conservando 5 productos y 0 unidades, con 5 saldos de apertura de seguimiento; no se reconstruyó historia. Backend actualizado y saludable. La lectura/conciliación real Oracle pasó sin insertar operaciones de prueba. Detalles de alcance y migración en INVENTARIO.md.

## Registro de compras según boceto

Nueva pantalla específica CompraForm: proveedor/comprobante y productos a la izquierda, resumen y confirmación a la derecha, con adaptación móvil. Reutiliza las reglas transaccionales y selección activa/preselección de proveedor existentes sin cambiar la pantalla de ventas. Fecha de recepción, comprobante y observaciones tienen validación y persistencia reales y se consultan desde el detalle. No se registra un pago al confirmar. La migración 05 fue aplicada en Oracle local, conservando el conteo de compras (0 antes/0 después); se reinició solo el backend del proyecto y se comprobó salud UP y contrato nuevo. Detalles y pasos reproducibles: COMPRAS.md.

## Diseño de proveedores según el boceto

Listado con encabezado compacto, botón azul de registro, filtros en tarjeta, búsqueda y Limpiar, tabla proveedor/documento/contacto/estado/acciones, Ver ficha y menú de edición/activación. Paginación con rango de registros y página actual. Formulario con retorno al listado, tarjetas separadas de Identificación y Contacto opcional, campos en dos columnas y pie con acciones. Estilos limitados a proveedores, adaptados a móvil. Se conservan permisos, datos reales, validaciones y conexión con compras; no se cambió el backend ni la base de datos.

Compilación de producción correcta y 19 pruebas Angular aprobadas. Recorridos Edge con API ficticia comprueban registro, compra preseleccionada, historial y duplicados; se añadió cobertura del menú y Limpiar. Capturas en docs/evidencias/proveedores-formulario.png y proveedores-listado-boceto.png.

## Corrección posterior del listado vacío con error

La SPA nueva estaba conectada a un backend antiguo y a un esquema sin la migración de proveedores. Se comprobó el contrato en ejecución, se aplicó el preflight/migración en Oracle real y se reinició solo el backend identificado de este proyecto. Se conservaron los 3 proveedores existentes, sin inferir tipos de documento. Además, el listado ya no presenta un error como ausencia de registros e incorpora reintento. Los resultados y límites están al principio de `pruebas-y-pendientes.md`.

## Actualización posterior: proveedores

Se reemplazó únicamente la interfaz genérica de proveedores por formulario, listado y ficha propios, conservando el estilo y Keycloak. Se añadieron identificación DNI/RUC, nombre comercial, contacto opcional, errores por campo, confirmación y compra preseleccionada. El listado busca/pagina/filtra estado; la ficha consulta compras reales y última fecha con los permisos existentes. Se incorporó baja lógica auditada y bloqueo de compra con proveedor inactivo. La selección de compras ahora busca/pagina proveedores activos y resuelve la preselección por ID.

La migración es aditiva, conserva tipo/contacto NULL anteriores y realiza preflight antes de añadir la unicidad por tipo/documento normalizado. No se aplicó en Oracle ni se borraron datos. Los detalles, compatibilidad de endpoints y pasos están en `PROVEEDORES.md`; los resultados de esta actualización están al principio de `pruebas-y-pendientes.md`. Los apartados siguientes documentan la revisión anterior.

## Etapa 1: diagnóstico

Creada `cumplimiento-curso.md` antes de modificar código. Revisados backend, frontend, scripts, SQL, Compose, Dockerfiles y documentación; contrastados programa, ADR, evaluaciones y producto U3 del curso. Se preservó `.env` y no se ejecutaron reparaciones de Oracle ni cambios sobre Keycloak. No existe repositorio `.git` en esta copia: no hay estado de commits que comparar ni se generaron commits.

Versiones declaradas: Java 21, Spring Boot 4.0.7, Modulith 2.0.7, SpringDoc 3.0.2; Angular 22.2.x, RxJS 7.8.x, TypeScript 6.0.x. Herramientas del equipo: Temurin 21.0.12.1, Node 24.16.0, npm 11.13.0; Maven Wrapper apunta a 3.9.16. Compose declara Oracle Free 23-slim, Keycloak 26.8.0 y PostgreSQL 17 para identidades. Declarar una imagen no demuestra que esté ejecutándose.

Versiones instaladas verificadas con npm ls: Angular core 22.2.3, CLI 22.2.4, RxJS 7.8.2, TypeScript 6.0.3 y Vitest 5.0.5.

## Etapa 2: ejecución y transacciones

- Reparado `backend/mvnw.cmd`: comprobaba `Target[0]` de un directorio sin enlace, lo que fallaba con matriz nula en Windows PowerShell.
- Incorporados helpers Windows de configuración, carga de entorno, arranque y pruebas Oracle. La configuración conserva un `.env` existente y no imprime secretos; la suite Oracle exige reconocer que se usa una base de pruebas porque inserta datos.
- Añadido `medir_api.py`, que estaba citado pero ausente. La decisión sobre Redis permanece provisional hasta medir Oracle real.
- El carrito ignora un segundo envío mientras hay una petición pendiente. Sus pruebas cubren varias líneas, cambios de cantidad, eliminación, total y ausencia de precios/actor/totales en el request de venta.
- Prueba nueva: dos ventas simultáneas sobre una sola unidad; debe haber una creación y un conflicto, sin stock negativo. El rollback comprueba también que no quedan detalles ni auditoría parcial.

Estas mejoras aportan evidencia para S4, S9, S13 y S14. Los resultados ejecutados se registran en `pruebas-y-pendientes.md`.

## Etapa 3: clientes y cuentas

- `ConsultaDniProvider` define el puerto de integración autorizado y su respuesta de nombres/apellidos. `ConsultaDniController` valida ocho dígitos, exige ADMIN, evita poner DNI en la URL y retorna 503 controlado sin proveedor o ante una falla. No hay endpoint remoto inventado.
- `MasterForm` permite consultar y completar el nombre. Conserva el registro manual cuando falla la consulta. Los campos originales y la base no fueron reemplazados.
- Nuevo módulo `seguridad` con `UsuarioController` y `KeycloakAdminClient`: listados acotados, creación con contraseña temporal, varios roles, activación/desactivación y cierre de sesiones. Solo admite ADMIN/SUPERVISOR/VENDEDOR/COMPRADOR; rechaza roles administrativos ajenos y roles compuestos. ADMIN es obligatorio en el filtro HTTP y en los métodos; no se puede alterar la propia cuenta.
- Las cuentas se crean desactivadas y se activan después de asignar roles. Una reconciliación de roles desactiva y cierra sesiones antes de cambiar permisos. Si falla, puede quedar desactivada y requiere revisión: no se promete atomicidad entre llamadas HTTP a Keycloak.
- Nueva pantalla Angular `features/seguridad/usuarios.ts`, con ruta diferida y menú ADMIN. El navegador nunca recibe el secreto de la cuenta de servicio ni su access token.
- Las pruebas del cliente HTTP verifican el contrato y la sanitización de errores contra un servidor simulado de Spring. No equivalen a un Keycloak real. Las operaciones administrativas se deben auditar mediante Admin Events de Keycloak; no se finge una transacción distribuida con la auditoría Oracle.

## Cómo defender una venta

1. `core/services/auth-service.ts` inicia Authorization Code + PKCE con Keycloak. El interceptor adjunta el token a la API y los guards controlan navegación.
2. `shared/operacion-form.ts` mantiene un FormArray. Al confirmar envía cliente e identificadores/cantidades, sin imponer precio ni total al servidor.
3. `ventas/controller/VentaController.java` aplica permisos y toma el actor del `sub` verificado. `VentaRequest` y `LineaVentaRequest` validan la entrada.
4. `ventas/service/VentaService.java` abre la transacción, valida duplicados y procesa productos por ID ascendente. Invoca la API pública `catalogo/service/ProductoService.java`.
5. `ProductoRepository.bloquear` usa bloqueo pesimista. Mientras conserva el bloqueo, el servicio verifica existencias, descuenta stock y devuelve el precio de catálogo. Otra venta debe esperar y validar el stock actualizado.
6. `VentaService` calcula subtotales y total con BigDecimal, persiste cabecera y detalles y llama a `AuditoriaService.registrar`, que exige una transacción existente. El DTO de respuesta conserva precios históricos.
7. Cualquier excepción de negocio en una línea revierte los cambios de toda la transacción. Las consultas `/ventas`, `/ventas/{id}` y `/ventas/resumen` permiten revisar el resultado; el resumen usa la base completa filtrada, no solo la página visible.
8. `FlujoBase` comprueba compra previa, venta, consulta, anulación, auditoría, fallo de segunda línea y concurrencia. Se ejecutó con H2 en modo Oracle; la clase `OracleEndToEndIT` reutiliza esos casos con Oracle real cuando esté disponible.

## Límite del alcance actual

Se mantienen stock por producto, detalles históricos y auditoría; aún no existe un libro independiente de movimientos ni almacenes/transferencias. No se cambió el modelo Oracle para aparentar ese alcance sin poder verificar la migración. La separación futura de inventario debe diseñar migración aditiva, conciliación del stock inicial y pruebas Oracle antes de aplicarse. Ningún esquema, volumen o dato existente fue eliminado.
