# Productos e inventario

Adaptación al boceto: catálogo con búsqueda por nombre/código interno/código de barras, categoría y stock; ficha de producto con stock actual, mínimo y precio; movimientos paginados con fechas, tipo, referencia, entrada, salida, saldo, motivo y responsable. El formulario incorpora código de barras opcional, unidad de venta y mínimo. El alcance admite UNIDAD y cantidades enteras; no ofrece kilos u otras unidades sin comportamiento implementado.

Los mínimos/unidades/códigos de barras anteriores permanecen NULL tras la migración. En el formulario de edición se muestran explícitamente los valores propuestos (Unidad y mínimo cero) para que el usuario los revise antes de guardar. Disponible significa existencia positiva y por encima del mínimo cuando está definido; Stock bajo significa positivo y menor o igual al mínimo; Sin stock significa cero. No se utiliza el umbral fijo anterior de cinco unidades.

## Registro real de movimientos

MM_CATALOGO.MOVIMIENTOS_STOCK guarda cada cambio desde la activación del seguimiento. Se crea una fila SALDO_INICIAL por producto con su stock observado, referencia MIG-06 y responsable técnico SISTEMA_MIGRACION. Esto no modifica existencias ni afirma reconstruir compras/ventas anteriores. Los saldos iniciales cero también dejan constancia del inicio.

Compras, ventas y sus anulaciones invocan la API pública de catálogo con actor y referencia C-ID/V-ID. La cabecera obtiene su ID dentro de la transacción antes de mover existencias, de modo que los movimientos conservan una referencia real. Cabecera, detalles, stock, movimientos y auditoría confirman o revierten juntos. Se conserva el bloqueo de producto y el orden de IDs para operaciones con varias líneas.

La merma informa unidades que salen y no puede superar stock. El conteo físico informa el total realmente contado; el servidor calcula la diferencia, que puede ser entrada, salida o cero. Ambos requieren ADMIN/SUPERVISOR, motivo (hasta 300 caracteres), cantidad entera válida y el stock observado al abrir el formulario. Si ese stock cambió, se rechaza con 409 para obligar a revisar la ficha. No existe un campo para editar existencias libremente en el CRUD del producto.

Los ajustes registran referencia propia, motivo y el sub de Keycloak en el movimiento y la auditoría existente. La consulta de movimientos está restringida a ADMIN/SUPERVISOR; los demás roles conservan consulta general de catálogo y ficha. El saldo mostrado es el saldo después de cada movimiento y no se recalcula sobre la página/los filtros visibles. Las referencias y responsables son los reales guardados; no se inventan nombres de usuarios.

## API

- GET /api/v1/productos: q, categoriaId, estadoStock (DISPONIBLE/BAJO/SIN_STOCK), page, size.
- GET /api/v1/productos/{id}/movimientos: desde, hasta inclusivo, tipo, page, size; ADMIN/SUPERVISOR.
- POST /api/v1/productos/{id}/ajustes: tipo MERMA/CONTEO, cantidad, stockEsperado y motivo; ADMIN/SUPERVISOR.
- DTO producto añade codigoBarras, unidadVenta y stockMinimo. Códigos de barras duplicados se protegen mediante índice único y retornan conflicto; el servidor conserva las reglas de código interno/precio/categoría.

## Migración 06

Detener únicamente el backend y disponer del respaldo habitual. Oracle confirma DDL implícitamente. El script añade columnas nullable, crea la tabla e índice de movimientos y protege códigos de barras con un índice único, previa comprobación de duplicados. No elimina ni combina registros. Añade permisos de tabla al usuario existente CANTOMODA_APP; no crea identidades nuevas.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrar-inventario.ps1
powershell -ExecutionPolicy Bypass -File scripts/migrar-inventario.ps1 -Aplicar
```

Sin -Aplicar solo lee conteos. Con -Aplicar crea los elementos ausentes y registra apertura para productos sin movimientos; repetir no duplica sus aperturas. No ejecutar con ventas/compras activas durante el cambio de versión. Arrancar el backend actualizado después de aplicar, con ddl-auto=validate. Las instalaciones nuevas incluyen 06_inventario.sql en su inicialización. Para Oracle sin Docker, ejecutar el SQL como cuenta de mantenimiento autorizada en FREEPDB1 sin publicar credenciales.

## Pruebas y límites

Las pruebas H2 verifican compra→venta→merma→conteo, saldo final, permisos, rechazo por stock insuficiente/lectura obsoleta, filtros, mínimos/barras/duplicados y rollback de movimientos ante fallo en segunda línea. Las pruebas de concurrencia y de anulaciones anteriores siguen ejecutándose. La prueba Oracle de solo lectura valida consultas y conciliación del último saldo sin escribir datos de negocio.

En frontend, las suites unitarias con Vitest cubren:
- `producto-list.spec.ts`: Indicadores exactos (Disponible, Stock bajo, Sin stock), manejo de errores diferenciado y reintento.
- `producto-form.spec.ts`: Validación de campos requeridos, conservación de ceros iniciales en código de barras y exclusión de edición directa de stock.
- `producto-ficha.spec.ts`: Carga de movimientos históricos, cálculo en vivo de diferencias en conteo físico y detección de conflictos de concurrencia (409).

## Flujo integral de una operación (Angular → Spring Boot → Oracle)

1. **Angular (Capa de Presentación)**: El usuario acciona el formulario o diálogo (compra, venta, merma o conteo). El componente valida en el cliente y despacha una solicitud HTTP mediante `ApiService`, adjuntando el token JWT con los roles de Keycloak.
2. **Spring Boot (Controladores y Seguridad)**: `ProductoController`, `VentaController` o `CompraController` intercepta la petición, valida la firma del token y la autorización `@PreAuthorize`.
3. **Servicios y Transaccionalidad (@Transactional)**: `ProductoService`, `VentaService` o `CompraService` coordina la operación. Se obtiene un bloqueo pesimista en la base de datos (`SELECT ... FOR UPDATE`) sobre el producto, se valida que el stock resultante no sea negativo ni haya cambiado (concurrencia optimista/pesimista), se persiste la cabecera y detalle de la operación, y se genera el registro en `MOVIMIENTOS_STOCK`.
4. **Auditoría**: `AuditoriaService` registra el evento en la misma transacción (`MM_AUDITORIA.AUDITORIA_LOGS`).
5. **Oracle (Capa de Persistencia)**: Hibernate ejecuta las sentencias SQL en los esquemas `MM_CATALOGO`, `MM_VENTAS`, `MM_COMPRAS` y `MM_AUDITORIA`. Si alguna condición falla, la transacción se revierte en su totalidad (`ROLLBACK`), garantizando atomicidad y consistencia.
