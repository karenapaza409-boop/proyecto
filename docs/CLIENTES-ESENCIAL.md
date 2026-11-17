# Clientes esenciales, sin ficha

Se reutilizaron ClienteList, ClienteForm, clientes.css, el servicio/repositorio/DTO y el adaptador ConsultaDniProvider existentes. No se encontró AGENTS.md. No se reemplazaron las pantallas, permisos ADMIN de escritura ni la integración de selección de cliente desde ventas. Solo hay listado, registro y edición; no se añadió ficha, historial, estadísticas, exportación ni integración externa.

El listado busca por nombre completo o DNI con paginación. Conserva el filtro de estado ya existente. La interfaz no presenta un fallo de consulta como lista vacía y ofrece reintento. Las acciones existentes llevan a editar, sin botón Ver ficha. El aviso utiliza la opción real Público general de ventas.

Nombres/apellidos se guardan por separado en columnas nuevas y se mantiene nombre como nombre completo compatible con ventas y la API previa. El servidor compone nombre a partir de los campos separados, valida longitudes, DNI de ocho dígitos y contacto opcional. Se conserva el contrato anterior nombre para consumidores existentes; no se usa para inferir apellidos. Un cliente histórico se muestra con su nombre original y campos separados vacíos hasta completarlos manualmente. La edición no vuelve a dividir el nombre por sus últimas palabras.

El teléfono y correo vacíos se convierten a NULL. La interfaz muestra errores después de interacción/envío, conserva datos ante fallos, señala duplicados con acceso a edición ADMIN y evita doble envío. El adaptador DNI original solo se invoca desde backend. Sin proveedor configurado o ante falla, se conserva el registro manual. Una respuesta tardía no sobrescribe nombres editados o pertenecientes a otro DNI. No se añadieron endpoints externos ni credenciales de ejemplo.

La unicidad se comprueba en servicio y mediante índice único normalizado TRIM(documento) en Oracle, conservando las restricciones anteriores. El guardado fuerza flush dentro de la transacción; una carrera por documento duplicado retorna conflicto y la UI puede localizar el cliente existente. Auditoría conserva las acciones y entidad CLIENTES; los nuevos mensajes no copian DNI/contacto completos al texto de auditoría. Los registros de auditoría anteriores permanecen intactos.

## Migración y otras instalaciones

Se conserva sin alterar la migración 07 que ya estaba en el proyecto. Para esta versión usar `08_clientes_identificacion.sql`, también incluida en inicializaciones nuevas. La 08 incorpora las columnas que falten (tipo/contacto/estado/nombres/apellidos), comprueba documentos duplicados tras TRIM antes de restricciones y se detiene para revisión humana si existen. No separa nombres, no clasifica documentos antiguos ni elimina filas. Los campos nuevos de identificación/contacto quedan NULL; activo=1 conserva la disponibilidad anterior.

Detener el backend durante la aplicación y disponer del respaldo habitual: Oracle confirma DDL implícitamente. Desde la raíz:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrar-clientes-esencial.ps1
powershell -ExecutionPolicy Bypass -File scripts/migrar-clientes-esencial.ps1 -Aplicar
```

Sin -Aplicar solo consulta conteos/duplicados. Si hay conflictos, revisar documentos reales; no corregir con valores ficticios ni eliminar/fusionar automáticamente. Después arrancar el backend actualizado con ddl-auto=validate. Sin Docker, ejecutar el SQL conectado a FREEPDB1 con cuenta autorizada, sin contraseñas en argumentos.

En esta sesión se aplicó 08 en Oracle local: 1 cliente antes/después y 0 grupos duplicados. Solo se reinició el backend identificado del proyecto. No se crearon clientes ficticios sobre la base real ni se alteraron ventas.

## Pruebas

ClienteIntegracionTest prueba creación con contacto vacío, edición y lectura separada de nombres/apellidos, búsqueda por nombre/DNI, paginación, validaciones, permisos, duplicados en servicio/BD y auditoría con H2 y repositorios reales. ClienteServiceTest existente se conserva; usa repositorio simulado y no acredita persistencia por sí solo. La regresión del registro manual ante fallo DNI sigue en FlujoIntegracionTest, con fixture DNI válido actualizado.

Cuatro pruebas Angular nuevas cubren fallback manual, doble envío, datos conservados ante duplicados, edición de legado sin inferencia y respuesta DNI tardía. El recorrido Edge usa API interceptada y datos ficticios para comprobar alta→búsqueda→edición y duplicado sin ficha. Comando: `npx playwright test --config playwright.clientes.config.ts`; requiere Edge. Los tokens ficticios están solo en test, no en producción.

ClienteOracleLecturaIT consulta la base real sin fixtures ni escrituras y comprueba listado, búsqueda por documento y lectura. Los resultados finales y límites están en pruebas-y-pendientes.md. No se afirma consulta DNI real: falta proveedor autorizado/configurado. La creación/edición sobre Oracle con login real queda pendiente de un entorno de pruebas dedicado.
