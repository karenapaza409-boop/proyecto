# Validación de la entrega

Fecha: 7 de noviembre de 2026.

| Comprobación | Resultado real |
|---|---|
| Compilación backend, Java 21 | Correcta |
| JAR ejecutable Spring Boot | Generado correctamente; configuración/claves de test y H2 excluidos |
| Pruebas backend | 14 aprobadas: 13 de integración y 1 de límites modulares |
| Persistencia de las pruebas ejecutadas | H2 en modo Oracle, servicios y repositorios reales |
| Firma/roles JWT | Caso RS256 con firma válida/inválida ejecutado con claves locales de prueba |
| Pruebas frontend | 7 aprobadas en 3 archivos |
| Angular build development y production | Correctos, sin errores |
| E2E Playwright | Un caso detectado y listo para ejecutar; no ejecutado de punta a punta aquí |
| Sintaxis JSON/YAML/XML y scripts Bash/Python | Revisada |
| SQL y mapeo de dominio | 9 tablas y 9 entidades del cantomoda, con esquemas funcionales y FK |
| Oracle y Keycloak reales | Pendiente de ejecución en equipo con Docker |
| Navegador/medición Network | Pendiente; el entorno de revisión impidió abrir sockets locales/Chromium |

Los logs de build y resúmenes de tests están en docs/evidencias. No se reutilizaron los reportes históricos del ZIP anterior como si fueran resultados de esta versión.

## Particularidad del entorno de revisión

La instalación Java disponible trae compilador 21, pero no la tabla ct.sym de un JDK completo para --release. Se validó con source=21 y target=21 en Maven. Comando de validación usado: mvnw -Dmaven.compiler.release= -Dmaven.compiler.source=21 -Dmaven.compiler.target=21 package. El pom conserva java.version=21 y la configuración normal del curso para usar un JDK 21 completo en el equipo del alumno.

## Pendientes que no se pueden sustituir con pruebas locales

1. Arrancar Compose en Docker y comprobar que se inicializan Oracle y el realm de Keycloak.
2. Ejecutar scripts/pruebas-oracle.ps1 o pruebas-oracle.sh: conecta a Oracle real; no simula repositorios. El principal JWT de esa suite se inyecta con Spring Security Test, como en S14.
3. Ejecutar npm run test:e2e con los tres servicios y frontend activos. Este caso sí usa login Keycloak real.
4. Medir el endpoint con Oracle, comprobar Network/caché, verificar F5 y renovación con usuarios reales.
5. Capturar evidencias propias, registrar commits y aportes, publicar documentación donde indique el docente y preparar la defensa.

El ZIP contiene las implementaciones y las pruebas reproducibles, pero no se afirma que Oracle, Keycloak, la defensa ni la publicación ya hayan sido verificados. Las credenciales de aula no son credenciales para un despliegue público.
