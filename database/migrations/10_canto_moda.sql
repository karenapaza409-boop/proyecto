-- Catalogo de Canto Moda: la carga inicial incluye prendas, tallas y precios.
-- Esta revision no altera existencias ni reemplaza prendas registradas por usuarios.
SET DEFINE OFF
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
COMMIT;
