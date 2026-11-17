# Pruebas y pendientes — 8 de noviembre de 2026

## Clientes esenciales sin ficha

- Compilación backend y frontend correctas. Selección relevante Maven: 22 pruebas aprobadas (2 integración de clientes con repositorios reales H2, 1 servicio existente con repositorio simulado, 18 de regresión del flujo y 1 límites modulares).
- Angular: 30 pruebas aprobadas en 11 archivos; incluye 4 nuevas de registro manual ante 503, doble envío, edición sin inferir apellidos, duplicados y respuesta DNI tardía.
- Edge: 1 recorrido aprobado con API interceptada y datos ficticios: DNI no disponible→alta manual sin contacto→búsqueda→edición→duplicado. Verificado que no aparece Ver ficha. Capturas clientes-registro.png y clientes-listado.png en evidencias.
- Oracle real: diagnóstico previo 1 cliente/0 grupos duplicados. Migración 08 aplicada conservando 1 cliente, sin clasificar ni separar su identificación anterior. Backend reiniciado solo para el proyecto, salud UP y contrato de nombres/apellidos publicado.
- ClienteOracleLecturaIT: 1 prueba de lectura real aprobada (listado, búsqueda y obtener); no inserta fixtures ni modifica documentos/contactos.
- Pendiente: consulta DNI real (sin proveedor configurado), alta/edición y carrera de duplicados en una Oracle dedicada de pruebas con autenticación real. H2 y API interceptada no acreditan esas operaciones reales.
- No se añadió ficha, historial, estadísticas, exportaciones ni nuevas integraciones. Se conservaron las pantallas/cambios existentes de clientes y el contrato de nombre completo usado por ventas.

## Productos e inventario

- Backend: package correcto, 35 pruebas aprobadas. Merma/conteo, saldo, permisos, stock insuficiente, lectura obsoleta, barras duplicadas, mínimo/filtro y rollback de movimientos probados con H2. La prueba del filtro combinado detectó un fallo de la consulta anterior; se sustituyó por Specifications con predicados para filtros presentes y se repitió correctamente.
- Frontend: 19 pruebas aprobadas y build production correcto. Edge con API ficticia: 4 recorridos aprobados, incluido catálogo→ficha→merma→conteo, además de compras/proveedores. No se presenta como autenticación real ni operación escrita en Oracle.
- Migración 06 en Oracle: 5 productos/0 unidades antes y después; 5 filas de apertura observadas. Se conservaron datos previos y se reinició únicamente el backend del proyecto. Salud UP y rutas de movimientos/ajustes publicadas.
- InventarioOracleLecturaIT aprobado contra Oracle real: valida esquema, listado, movimientos y conciliación del último saldo, sin crear fixtures ni ajustes.
- Capturas en evidencias/inventario-catalogo.png, inventario-movimientos.png, inventario-movil.png e inventario-formulario.png. Datos de pantalla de prueba ficticios.
- Pendiente: operación completa autenticada de merma/conteo/compra/venta sobre una Oracle dedicada de pruebas. No se generaron ajustes ficticios en la base del usuario.

## Registro de compras adaptado al boceto

- Backend package correcto: 33 pruebas aprobadas. La nueva prueba persiste y consulta fecha/comprobante/observaciones en H2, rechaza fecha futura y comprobante incompleto y comprueba que esos errores no cambian stock.
- Angular: 19 pruebas aprobadas y build production correcto.
- Edge con API interceptada: 3 recorridos aprobados; compra con proveedor preseleccionado, factura, número con ceros iniciales y observaciones. Verificado envío de esos valores y ancho móvil de 390 px sin desbordamiento de página. Se corrigieron tamaños mínimos de columnas/selectores detectados en la primera ejecución móvil.
- Capturas inspeccionadas: evidencias/compras-boceto.png y evidencias/compras-boceto-movil.png; contienen datos ficticios de prueba.
- Oracle local: migración aditiva 05 aplicada correctamente; 0 compras antes y después. No se modificaron proveedores, productos o stock para las pruebas. Backend reiniciado, Hibernate valida el esquema, salud UP y OpenAPI publica los campos nuevos.
- Pendiente: creación/consulta de una compra nueva de punta a punta con autenticación real contra Oracle. La prueba de persistencia descrita fue H2; no se presenta la API interceptada como una operación real.

## Adaptación visual al boceto de proveedores

Frontend: 19 pruebas aprobadas; build production correcto. Edge con API de prueba: 3 recorridos aprobados, incluidos Limpiar y menú de acciones, además de alta, duplicado y conexión con compras. Se inspeccionaron las capturas de formulario de escritorio/móvil y listado. Cambios limitados a presentación de proveedores y pruebas; no hubo modificaciones del backend ni de datos en esta adaptación.

## Cierre de la incidencia del listado de proveedores

- Causa verificada mediante OpenAPI del proceso en ejecución: backend anterior sin `/proveedores/buscar`; solo aceptaba nombre/documento. El esquema Oracle también estaba sin migrar (la validación detectó ACTIVO ausente).
- Preflight real de solo lectura en FREEPDB1: sin grupos duplicados. Migración 04 aplicada sin borrados; se conservaron 3 proveedores, 0 compras y los tipos antiguos NULL.
- Se reinició únicamente el backend cuyo proceso Maven pertenecía a este proyecto. El contrato publicado ahora incluye búsqueda, estado, duplicados e historial.
- `ProveedorOracleLecturaIT`: consulta real sin filtros aprobada, con validación Hibernate del esquema; no prepara datos ni ejecuta DDL.
- Regresión H2 `listadoInicialSinFiltrosMuestraProveedorRecienRegistrado`: aprobada. No prueba por sí sola el despliegue; la comprobación Oracle se registró por separado.
- Angular: 19 pruebas en 7 archivos aprobadas; build production correcto. La prueba nueva verifica que un error no muestra una tabla vacía y que Reintentar recupera el listado.
- Queda pendiente el E2E completo con autenticación real. La migración y la consulta Oracle de esta incidencia sí se ejecutaron; no confundir con los pendientes históricos siguientes.

## Actualización posterior: proveedores

| Comprobación | Resultado de esta actualización |
|---|---|
| Backend package | Correcto; JAR generado y 31 pruebas aprobadas, sin fallos ni omitidas |
| Pruebas específicas de proveedores | 8 aprobadas con H2 modo Oracle y persistencia/transacciones reales; no se simularon repositorios |
| Angular | 18 pruebas aprobadas en 6 archivos; incluyen formulario propio y conexión con compras |
| Build production | Correcto; paquete inicial 304.48 kB y transferencia estimada 83.00 kB; pantallas de proveedores diferidas |
| Navegador Edge headless | 2 recorridos aprobados con API interceptada y datos ficticios: alta→compra preseleccionada→historial→desactivar, y duplicado→abrir ficha |
| Presentación | Formulario inspeccionado en capturas de escritorio y móvil; sin desbordamiento horizontal de la página a 390 px |
| Migración Oracle | Preparada; no aplicada ni verificada sobre Oracle; preflight obligatorio antes del DDL, sin borrados/fusiones |
| Helper de migración | Sintaxis PowerShell comprobada con parser AST; no ejecutado contra una base |
| Oracle/Keycloak reales | Siguen sin verificar en este entorno; no hay Docker disponible ni listener local detectado para esos servicios |

Las pruebas de navegador detectaron nombres accesibles que incluían ayudas/errores y opciones de un select. Se corrigieron con etiquetas accesibles estables y se repitieron los dos recorridos correctamente. La comparación de fechas del test backend se ajustó a la fecha realmente persistida, porque TIMESTAMP reduce la precisión de nanosegundos. Se repitió Maven package completo con resultado correcto.

Evidencias: `evidencias/proveedores-2026-11-08.txt`, `evidencias/proveedores-formulario.png` y `evidencias/proveedores-formulario-movil.png`. Los datos de las capturas son ficticios de pruebas. La API de producción obtiene historial y última fecha de sus repositorios reales; la interceptación existe solo en el archivo de pruebas UI.

Pasos de aplicación y limitaciones en `PROVEEDORES.md`. Aplicar la migración antes de arrancar este backend sobre una base existente. Revisar los duplicados que detecte el preflight con un responsable; no se conoce el estado real de esos datos y no se asignó un tipo de documento supuesto. Pendiente ejecutar la migración dos veces en Oracle de pruebas, comprobar rechazo ante duplicados deliberados y realizar el recorrido autenticado sin interceptar API.

## Revisión anterior

Los resultados de `VALIDACION.md` son históricos. Esta página registra la revisión actual; no atribuye resultados de H2 a Oracle.

| Comprobación | Resultado actual | Evidencia |
|---|---|---|
| Maven Wrapper Windows | Reparado y ejecutado | Desapareció el error Target[0]/matriz nula |
| Backend package + pruebas | Correcto: 23 pruebas, 0 fallos, 0 errores, 0 omitidas; JAR generado | backend/target/surefire-reports; cierre Maven 12:03, America/Lima |
| Atomicidad y persistencia | Verificadas en H2 modo Oracle | FlujoIntegracionTest: stock, cabecera, detalles y auditoría; transacciones reales sin mocks de repositorios |
| Ventas concurrentes | Verificadas en H2 | Una unidad y dos peticiones: 201/409, stock final 0 |
| Límites modulares | Verificados | ApplicationModules.verify, incluido nuevo módulo seguridad |
| Administración: roles y fallos | Verificados con cliente externo simulado | UsuariosTest; sin token 401, rol insuficiente 403, autocambio/rol ajeno 409; falla de asignación no activa cuenta |
| Keycloak HTTP | 3 pruebas de contrato aprobadas | KeycloakAdminClientTest; servidor HTTP simulado, no es un servicio real |
| DNI y registro manual | Verificados con proveedor ausente | 503 controlado, formato inválido 400, vendedor 403, guardado manual 201 |
| Angular tests | 10 aprobadas en 4 archivos | Auth, interceptor, carrito y fallback manual |
| Angular production | Correcto | Inicial 303.83 kB; transferencia estimada 82.79 kB; usuarios/master-form como chunks diferidos |
| Scripts PowerShell | Sintaxis válida | Parser AST sobre todos los .ps1; configurar.ps1 conserva el .env existente |
| Oracle real | No verificado | Sin listener 1521 detectado; docker no está en PATH ni en ubicación estándar revisada |
| Keycloak real | No verificado | Sin listener 38080 detectado; cuenta de servicio pendiente de configuración |
| E2E navegador real | No ejecutado | Sin infraestructura ni frontend/backend activos; no se usa un resultado simulado como prueba E2E |
| Migraciones | No se introdujeron ni ejecutaron | Mapeos Oracle existentes y SQL conservados; compatibilidad real aún no verificada |
| Redis/latencia Oracle | No medidos | Helper de medición añadido; falta servicio/token de pruebas |

## Comandos reproducibles en Windows

Desde backend: `.\mvnw.cmd package`. Desde frontend: `npm test -- --watch=false` y `npm run build -- --configuration production`.

Desde la raíz: `powershell -ExecutionPolicy Bypass -File scripts/configurar.ps1`, `docker compose up -d`, y en otra terminal `powershell -ExecutionPolicy Bypass -File scripts/backend.ps1`; iniciar Angular con `npm start` desde frontend.

Suite Oracle, únicamente sobre base de pruebas: `powershell -ExecutionPolicy Bypass -File scripts/pruebas-oracle.ps1 -ConfirmarBaseDePruebas`. Inserta registros ficticios; no limpia datos preexistentes. Primero revisar DB_URL/DB_USER localmente sin exponer su contraseña.

Con todos los servicios activos, definir E2E_PASSWORD en el proceso y ejecutar `npm run test:e2e` desde frontend. E2E_USER permite escoger la cuenta ADMIN de pruebas. La prueba exige credencial explícita, crea datos reales y no suplanta Keycloak.

Las primeras ejecuciones encontraron restricciones de aislamiento: Angular no podía resolver directorios y Maven no podía conectarse a Central. Las verificaciones se repitieron con la autorización de ejecución correspondiente. Una prueba nueva de administración usaba un JSON incompleto; se corrigió el fixture y se reforzó además el filtro ADMIN previo a deserializar solicitudes.

La prueba de contrato HTTP presentó una ambigüedad entre MediaType de JUnit y Spring; se corrigieron las importaciones explícitas y se repitió package completo, con las 23 pruebas aprobadas. Resumen reproducible sin cuerpos ni secretos: `evidencias/revision-2026-11-08.txt`.

## Pendientes reales

1. Instalar/disponer de Docker Desktop y arrancar Oracle/Keycloak sin borrar volúmenes. Validar esquema con ddl-auto validate y ejecutar OracleEndToEndIT.
2. Configurar cliente confidencial del backend con Service Accounts, permisos mínimos de administración y secreto local; habilitar Admin Events. Comprobar creación, dos roles, desactivación, cierre de sesiones y errores reales. Los access tokens ya emitidos pueden sobrevivir hasta su expiración; cerrar sesiones impide renovar, no invalida criptográficamente un JWT existente.
3. Seleccionar proveedor DNI autorizado y facilitar su contrato/configuración. Implementar el bean ConsultaDniProvider con timeout y traducción de respuesta; no hay llamadas remotas mientras falte ese contrato.
4. Ejecutar E2E con Oracle y Keycloak, revisar recarga F5, renovación 401 y permisos denegados en navegador; capturar evidencias sin secretos.
5. Diseñar libro de movimientos y eventual separación de inventario. Transferencias requieren un modelo de almacenes que esta versión no tiene. No se declara implementado.
6. Medir latencia real, revisar índices/planes y completar justificación medida de Redis. El tamaño del bundle no mide rendimiento Oracle.
7. Identificar integrantes y aportes reales, preparar demo grupal y defensa/examen individual. No se inventaron autores, commits ni cumplimiento académico global.
