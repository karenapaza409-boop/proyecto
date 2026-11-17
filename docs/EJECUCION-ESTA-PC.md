# Canto Moda: ejecucion en esta PC

Abra Docker Desktop y espere a que este listo. Desde Visual Studio Code, abra CantoModa_LP2.code-workspace y ejecute en la terminal:

```powershell
.\INICIAR-CANTO-MODA.cmd
```

La pagina se abre automaticamente en http://localhost:4201.

- API: http://localhost:8080
- Salud: http://localhost:8080/actuator/health
- Acceso: http://localhost:38081/realms/cantomoda
- Oracle: localhost:1523/FREEPDB1, usuario CANTOMODA_APP.

Las claves de infraestructura estan en .env. Las contrasenas de las cuentas existentes se conservaron durante la migracion.

Los datos activos estan en los volumenes cantomoda-lp2_oracle-data y cantomoda-lp2_keycloak-db. Se conservaron los volumenes previos como respaldo; no se utilizan para arrancar la tienda. Copiar la carpeta del proyecto a otra PC no copia los datos de Docker.

Para detener la infraestructura conservando datos: docker compose stop. No usar docker compose down -v.

El diseno usa rojo vino y el catalogo incluye prendas con talla y color. Cada variante usa su propio codigo; no existen selectores de variantes ni un sistema de confeccion.

Validacion de esta revision: 46 pruebas backend y 65 pruebas frontend correctas; compilacion de produccion correcta; login real, catalogo y administracion de cuentas verificados en Edge. Se conservaron las prendas agregadas por el usuario y sus existencias.
