# Revision de identidad Canto Moda

Se actualizaron los paquetes Java a pe.edu.cantomoda, la clase de inicio a CantoModaApplication, los artefactos de backend y frontend, la configuracion de Angular, las claves de sesion, el realm de acceso y los clientes de Keycloak.

El catalogo inicial, los ejemplos de formularios, las pruebas, los iconos del punto de venta y la documentacion se dedican a prendas de vestir.

Se migraron las conexiones de Oracle y Keycloak y se copiaron los volumenes detenidos a los nombres Canto Moda. Se conservaron las cuentas y sus contrasenas, las prendas registradas y las operaciones. El secreto del servicio administrativo se renovo y se guardo en .env.

Validacion: 46 pruebas backend sin fallos, 65 pruebas frontend sin fallos, compilacion de produccion correcta. El compilador advierte que ventas.css supera el presupuesto recomendado en 1.87 kB; no impide compilar.

Se verifico con Edge el login real, las siete prendas existentes y el listado de las cuatro cuentas de personal. Se corrigio la deteccion de pruebas Angular para rutas Windows con parentesis mediante vitest.config.ts.
