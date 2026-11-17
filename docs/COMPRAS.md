# Registro de compras según boceto

Pantalla propia de compras con proveedor/comprobante y productos a la izquierda; resumen, efectos de la operación y confirmación a la derecha. Adaptación móvil en una columna, sin copiar cifras ni proveedores del boceto. Se mantienen Keycloak, proveedores activos, búsqueda paginada, preselección por ID, validación de stock y transacción atómica. Ventas conserva su pantalla.

El resumen calcula productos, unidades y total de las líneas actuales. La compra registra mercadería recibida y no registra pagos. La búsqueda admite códigos existentes del catálogo o nombres; un lector que escribe como teclado puede introducir ese código. No hay una integración inventada con lectores o códigos de barras externos.

Fecha de recepción, tipo de comprobante, serie, número y observaciones se envían al backend, se validan y se persisten en COMPRAS. La fecha no puede ser futura. El comprobante es opcional; si se informa, tipo, serie y número deben estar completos. Serie permite letras/números/guion (20 caracteres), número solo dígitos (20), observaciones hasta 1000 caracteres. El número es texto y conserva ceros iniciales. No se valida fiscalmente ni se registra un pago. La consulta del detalle de compra muestra estos datos.

## Migración incremental

`database/migrations/05_compras_recepcion.sql` agrega cinco columnas nullable: FECHA_RECEPCION, TIPO_COMPROBANTE, SERIE, NUMERO y OBSERVACIONES. Conserva los datos anteriores sin deducir fechas ni documentos. No modifica importes, stock o detalles históricos. DDL Oracle confirma implícitamente; aplicar con backend detenido y el respaldo habitual disponible. El script es repetible y añade solo columnas ausentes.

Desde la raíz, con Oracle Docker activo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrar-compras.ps1
powershell -ExecutionPolicy Bypass -File scripts/migrar-compras.ps1 -Aplicar
```

El primer comando solo consulta metadatos/conteos. Reiniciar el backend actualizado después de aplicar; Hibernate mantiene ddl-auto=validate. Las instalaciones nuevas incluyen el script en 01-init.sh. Sin Docker, ejecutar el SQL con una cuenta de mantenimiento autorizada conectada a FREEPDB1. No introducir contraseñas en argumentos o documentación.

## Verificación

FlujoBase contiene el caso de persistencia y lectura de recepción/comprobante/observaciones, más rechazo de fecha futura y comprobante incompleto sin modificar stock. La suite UI de proveedores recorre también la nueva pantalla de compra, informa factura y observaciones, verifica su envío y toma capturas de escritorio/móvil. Esa suite intercepta la API y usa datos ficticios: no certifica por sí sola Oracle ni autenticación real.

Resultados y aplicación local: docs/pruebas-y-pendientes.md. No se crean compras ficticias en la base del usuario para verificar presentación.
