# Contraste LP2 — 8 de noviembre de 2026

Diagnóstico inicial creado antes de modificar código. No existe `.git` en esta copia; `git status` falla. No se encontraron AGENTS.md. Se conservan los archivos existentes. Los resultados antiguos de `docs/VALIDACION.md` son antecedentes, no comprobaciones de esta sesión.

## Fuentes y alcance

- [Programa y sesiones S1–S16](https://262ciclo4.github.io/bomerp/lp2/), [sílabo 2026-2](https://262ciclo4.github.io/bomerp/lp2/silabo_lp2_2026_2/).
- [ADR-001](https://262ciclo4.github.io/bomerp/lp2/adr/ADR-001-arquitectura-backend/), [ADR-002](https://262ciclo4.github.io/bomerp/lp2/adr/ADR-002-spring-modulith/), [ADR-003](https://262ciclo4.github.io/bomerp/lp2/adr/ADR-003-spring-boot-4/).
- [S6](https://262ciclo4.github.io/bomerp/lp2/sesiones/S06_Evaluacion_Unidad_1/), [S12](https://262ciclo4.github.io/bomerp/lp2/sesiones/S12_Evaluacion_Unidad_2/), [S15](https://262ciclo4.github.io/bomerp/lp2/sesiones/S15_Evaluacion_Unidad_3/), [S16](https://262ciclo4.github.io/bomerp/lp2/sesiones/S16_Evaluacion_Final_Individual/).
- [S10b](https://262ciclo4.github.io/bomerp/lp2/sesiones/S10b_Seguridad_Backend_Keycloak/), [S13](https://262ciclo4.github.io/bomerp/lp2/sesiones/S13_Optimizacion_Preparacion_Produccion/), [S14](https://262ciclo4.github.io/bomerp/lp2/sesiones/S14_Integracion_Estabilizacion/), [producto U3](https://262ciclo4.github.io/bomerp/proyecto-integrador/u3/lp2-producto/).

Fuentes accesibles mediante consulta web. Revisados también ARQUITECTURA, API_Y_SEGURIDAD, OPTIMIZACION, VALIDACION, AVANCE_LP2, FUENTES y pruebas del proyecto. No se encontraron documentos originales del docente en PDF/Word. El índice del curso se revisó completo; no se atribuye revisión línea por línea de todos los ejemplos de cada sesión.

## Obligaciones académicas

| Requisito y fuente | Estado inicial | Evidencia local | Cambio necesario | Cómo se comprobará |
|---|---|---|---|---|
| Aplicación única Java 21 / Boot 4.0.7, ADR-001/003 | parcial | backend/pom.xml; JDK 21.0.12.1 instalado | Recompilar en este equipo | Maven package |
| Límites Modulith 2.0.7, ADR-002 | no verificado | ModularityTests; NamedInterface y allowedDependencies | Ejecutar verificación | Maven test |
| Oracle por esquemas funcionales, S1/arquitectura | parcial | SQL MM_CATALOGO, MM_VENTAS, MM_COMPRAS, MM_AUDITORIA; ddl-auto validate | Verificar contra Oracle; inventario actualmente integrado en catálogo | Suite oracle-it y validación de esquema |
| REST versionado, DTO, validación, errores, S1–S2 | parcial | /api/v1, dto, mapper, GlobalExceptionHandler | Revisar fallos de integraciones externas | Pruebas HTTP 400/401/403/404/409/503 |
| CRUD y relaciones, S2–S3 | parcial | Categoria–Producto, Cliente–Venta, Proveedor–Compra | Reejecutar pruebas | Integración persistente |
| Cabecera-detalle/N:M con atributos, S4 | parcial | Venta/Compra y sus detalles | Reejecutar flujo con varias líneas | Integración y E2E |
| Atomicidad, stock y rollback, S4/S14 | parcial | @Transactional, bloqueo pesimista y orden ascendente; FlujoBase | Añadir concurrencia y comprobar ausencia de residuos | Dos ventas concurrentes y fallo en segunda línea |
| Filtros, consultas y reportes, S5 | parcial | buscar/agregado, DTO, filtros fecha/estado | Reejecutar agregados | Prueba paginación independiente del total |
| SPA Angular 22 core/shared/features, S7–S9 | parcial | package.json; rutas loadComponent; FormArray | Build y pruebas actuales | npm test y build production |
| Keycloak backend y frontend, S10b–S12 | parcial | Resource Server, PKCE, guard, interceptor | Prueba real de login/renovación pendiente | Roles con JWT de prueba; E2E real separado |
| Auditoría crítica, S14 | parcial | AuditoriaService con MANDATORY | Confirmar rollback de auditoría | Integración; Oracle pendiente |
| Paginación sin romper agregados, S14 | parcial | PageResponse y consultas resumen | Reejecutar | FlujoBase |
| Lazy loading, caché y Redis justificado, S13 | parcial | rutas, nginx, OPTIMIZACION | Falta script medir_api.py citado; falta medición Oracle | Build y medición autenticada real |
| Logging, monitoreo y perfiles, S13 | parcial | CorrelationIdFilter, logback, Actuator, perfiles dev/prod | Comprobar arranque real | health y logs sin secretos |
| Despliegue y Windows, S13 | parcial | Dockerfiles, compose, README | Faltan helpers citados en README; Docker no está en PATH | Scripts y compilaciones; Docker pendiente |
| Pruebas E2E contra base real, S14/U3 | no verificado | OracleEndToEndIT; Playwright | Ejecutar con servicios disponibles | No sustituir Oracle con H2 |
| Evaluaciones U1/U2, S6/S12 | no verificado | Código y guía de sustentación | Evidencias propias de demo, aportes y defensa | Docente/equipo; código no acredita aprobación |
| Producto grupal y defensa individual, S15; examen individual S16 | pendiente | PRUEBAS_Y_SUSTENTACION | Identificar aportes reales, demo conjunta y preparación individual | Demo autenticada y defensa; sin inventar autores/commits |

## Ideas del negocio (no se presentan como obligaciones del curso)

| Requisito y fuente | Estado inicial | Evidencia | Cambio necesario | Cómo se comprobará |
|---|---|---|---|---|
| Consulta DNI autorizada, solicitud del usuario | pendiente | Solo ingreso manual de nombre/documento | Puerto de proveedor configurable sin endpoint inventado; fallback manual | 503 sin proveedor; registro manual válido |
| Crear/activar/desactivar usuarios con varios roles, usuario | pendiente | Realm con roles; falta administración desde aplicación | API backend con cuenta de servicio y UI ADMIN | Contratos HTTP, acceso denegado, roles permitidos; Keycloak real pendiente |
| Carrito multiproducto, usuario | parcial | OperacionForm y VentaService existentes | Mantener precio decidido por servidor y probar concurrencia | Pruebas carrito/rollback/concurrencia |
| Inventario y movimientos, usuario | parcial | Stock en producto; detalles históricos en venta/compra | Consulta unificada de movimientos; valorar módulo específico en etapa posterior | Consistencia stock y movimientos |
| Transferencias entre almacenes, usuario: si corresponde | pendiente | Una sucursal, sin almacenes | Fuera del alcance actual; requiere modelo de almacenes | No afirmar implementación |

## Recomendaciones técnicas

No reestructurar esquemas existentes ni añadir Redis sin evidencia. Reparar scripts ausentes, retirar contraseñas de documentación, añadir pruebas relevantes de concurrencia y adaptar servicios externos con errores controlados. No ejecutar scripts de reparación ni migraciones sobre datos existentes durante el diagnóstico. Docker no está disponible como comando en esta sesión; se comprobará si existen servicios escuchando antes de declarar bloqueada la validación real.

## Estado después de las etapas implementadas

La tabla inicial se conserva como diagnóstico. El detalle actualizado y los impedimentos están en `pruebas-y-pendientes.md`.

| Requisito | Estado al cierre | Evidencia de esta sesión | Pendiente para acreditarlo completamente |
|---|---|---|---|
| Compilación Java/Angular y límites de módulos | cumple | Maven package, ModularityTests y Angular production correctos | Ninguno para esas comprobaciones locales |
| Persistencia, rollback, concurrencia y roles | parcial | 23 pruebas backend aprobadas; H2, JWT RS256 de prueba con varios roles y cliente administrativo simulado | Repetir sobre Oracle y Keycloak reales |
| Carrito multiproducto | parcial | 10 pruebas frontend aprobadas; líneas/cantidades/quitar/total/doble envío y DTO sin precio de venta | Recorrido de navegador con servicios reales |
| Adaptador DNI y fallback manual | cumple | Puerto backend, 503 sin proveedor, formato inválido y registro manual probados | La consulta real permanece pendiente de proveedor autorizado |
| Administración de cuentas con varios roles | parcial | API y UI implementadas; autorización, cuenta desactivada inicial, fallos y contrato HTTP probados | Configurar cliente confidencial y Admin Events; comprobar contra Keycloak |
| Guía Windows y helpers | parcial | Scripts añadidos, parser correcto, .env existente conservado; wrapper ejecutado | Arranque Docker/Oracle/Keycloak no disponible aquí |
| Documentación y trazabilidad | cumple | cumplimiento-curso, cambios-realizados, pruebas-y-pendientes y README actualizados | Evidencias académicas y aportes individuales siguen siendo del equipo |
| Libro independiente de movimientos y transferencias | pendiente | Stock, detalles y auditoría existentes conservados | Diseñar modelo, migración aditiva y validación Oracle |
| Producto integrado y evaluaciones del curso | no verificado | Hay código y pruebas locales; fuentes y evidencias diferenciadas | E2E real, mediciones, demo y defensa individual/grupal |
