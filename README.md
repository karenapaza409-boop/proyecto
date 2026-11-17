# Canto Moda

Sistema de gestión para una tienda de ropa en Canto. Permite administrar una colección de polos, pantalones, casacas y accesorios, registrar ventas y compras, controlar existencias y consultar auditoría. Los importes se expresan en soles y cada combinación de prenda, color y talla se registra con un código propio.

## Inicio en esta PC

Requisitos: Docker Desktop abierto, JDK 21 y Node.js 24.

Abra esta carpeta en Visual Studio Code y ejecute:

```powershell
.\INICIAR-CANTO-MODA.cmd
```

La aplicación se abre en http://localhost:4201. El iniciador utiliza la configuración local de `.env` y conserva la base de datos. Los registros de arranque se guardan en `logs`.

## Inicio manual

Desde la carpeta principal:

```powershell
docker compose up -d
powershell -ExecutionPolicy Bypass -File scripts/backend.ps1
```

En otra terminal:

```powershell
cd frontend
npm.cmd start
```

- Web: http://localhost:4201
- API: http://localhost:8080
- Salud: http://localhost:8080/actuator/health
- Acceso de usuarios: http://localhost:38081/realms/cantomoda
- Oracle: localhost:1523/FREEPDB1, usuario CANTOMODA_APP.

## Colección y operaciones

El catálogo de ejemplo contiene polos de algodón por talla y color, jeans, joggers y casacas. Las prendas comienzan sin existencias: registre una compra recibida para ingresar stock antes de vender. Las ventas descuentan existencias y su anulación las devuelve. Las compras registran el costo de adquisición.

Roles: ADMIN, SUPERVISOR, VENDEDOR y COMPRADOR. Las cuentas de demostración se definen en `keycloak/cantomoda-realm.json`; las contraseñas actuales de una instalación existente se mantienen al migrar. Las claves de infraestructura están en `.env` y no se deben publicar.

## Pruebas

```powershell
cd backend
.\mvnw.cmd test
```

```powershell
cd frontend
npm.cmd test -- --watch=false
npm.cmd run build -- --configuration production
```

## Datos persistentes

Oracle y el acceso de usuarios guardan sus datos en volúmenes Docker. `docker compose stop` detiene la infraestructura conservando los datos. No utilice `docker compose down -v` para detener la tienda: borra los volúmenes. Copiar solo esta carpeta a otra PC no transfiere los datos de Docker.

La carpeta `docs` contiene las guías de cada módulo. `CantoModa_LP2.code-workspace` abre backend y frontend en Visual Studio Code.
