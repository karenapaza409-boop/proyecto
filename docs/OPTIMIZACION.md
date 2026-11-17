# Optimización y preparación

## Medición real de builds

Mediciones de esta entrega, con el mismo código y Angular CLI:

| Configuración | Tamaño inicial sin comprimir | Transferencia estimada CLI |
|---|---|---|
| Development | 1.48 MB | No aplica |
| Production | 303.31 kB | 82.77 kB |

La reducción aproximada del tamaño inicial es 79.5%. Es comparación development/production, no una medición de latencia de usuarios ni una promesa de rendimiento en Oracle. Los logs completos se incluyen en evidencias/build-*.txt; browser-stats-production.json contiene las estadísticas generadas por el build final.

Los componentes de funcionalidades se importan por ruta con loadComponent. OperacionForm, OperacionList, productos, maestros y auditoría aparecen como chunks diferidos separados. Verificar su descarga real navegando con Network en el equipo del alumno. Los budgets de angular.json hacen fallar el build si el paquete inicial supera 1 MB o un estilo de componente supera el límite configurado.

## Caché

- GET categorías responde Cache-Control privado, max-age=30. Es una lectura de referencia poco cambiante.
- ApiService cambia la revisión de la URL de categorías tras una escritura exitosa para que el propio usuario vea su CRUD actualizado.
- En producción local Nginx permite caché inmutable de JS/CSS con hash, y obliga a revalidar index.html para no cargar una versión antigua de la SPA.
- No se cachean transacciones ni escrituras como si fueran datos estáticos.

## Decisión sobre Redis

No se añade Redis al alcance de una sucursal. Ya existen carga diferida, paginación, consultas agregadas e información de categorías con caché HTTP. Agregar otro almacén sin comprobar una necesidad introduciría invalidación de stock/precios y operación adicional.

Esta decisión es provisional hasta medir el backend con Oracle real; no se presenta la medición de H2 o del bundle como si fuera una medición de latencia Oracle. El script scripts/medir_api.py ejecuta 20 lecturas HTTP autenticadas, informa primera petición, mediana y p95 sin imprimir el token. Definir MM_TOKEN con un access_token vigente y ejecutar el script con el backend real; guardar la salida como evidencia. Network permite verificar aparte el beneficio de caché de navegador.

Reconsiderar Redis solamente si las mediciones con los datos/usuarios previstos muestran una lectura repetida costosa que siga lenta después de revisar consulta, índices y caché HTTP. Documentar endpoint, volumen, tiempos y política de invalidación. La rúbrica permite justificar su no uso; no exige instalarlo sin motivo.

## Observabilidad y producción

Logs con fecha, nivel, traceId, logger y campos method/path/status/durationMs. Nunca se escriben tokens ni contraseñas. El interceptor y CorrelationIdFilter comparten X-Trace-ID.

El perfil prod usa variables de entorno, desactiva Swagger y solo expone /actuator/health, sin detalles internos. Los esquemas se validan al arrancar. Dockerfiles construyen el JAR y la SPA; compose.prod.yml muestra ejecución reproducible local. Keycloak start-dev/HTTP sigue siendo infraestructura de aula, no un despliegue público con TLS.
