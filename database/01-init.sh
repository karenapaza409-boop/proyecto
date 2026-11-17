#!/usr/bin/env bash
set -euo pipefail
sqlplus -L -s / as sysdba <<SQL
WHENEVER OSERROR EXIT FAILURE
WHENEVER SQLERROR EXIT SQL.SQLCODE
ALTER SESSION SET CONTAINER=FREEPDB1;
DECLARE
  n NUMBER;
BEGIN
  FOR r IN (SELECT 'MM_CATALOGO' nombre FROM dual UNION ALL SELECT 'MM_VENTAS' FROM dual UNION ALL SELECT 'MM_COMPRAS' FROM dual UNION ALL SELECT 'MM_AUDITORIA' FROM dual) LOOP
    SELECT COUNT(*) INTO n FROM dba_users WHERE username=r.nombre;
    IF n=0 THEN
      EXECUTE IMMEDIATE 'CREATE USER '||r.nombre||' NO AUTHENTICATION DEFAULT TABLESPACE USERS QUOTA UNLIMITED ON USERS';
    END IF;
  END LOOP;
  SELECT COUNT(*) INTO n FROM dba_users WHERE username='CANTOMODA_APP';
  IF n=0 THEN
    EXECUTE IMMEDIATE 'CREATE USER CANTOMODA_APP IDENTIFIED BY "$DB_PASSWORD"';
  END IF;
END;
/
GRANT CREATE SESSION TO CANTOMODA_APP;
@/opt/cantomoda/02_tablas_datos.sql
@/opt/cantomoda/migrations/04_proveedores.sql
@/opt/cantomoda/migrations/05_compras_recepcion.sql
@/opt/cantomoda/migrations/06_inventario.sql
@/opt/cantomoda/migrations/08_categorias.sql
@/opt/cantomoda/migrations/08_clientes_identificacion.sql
@/opt/cantomoda/migrations/09_ventas_efectivo.sql
EXIT;
SQL
touch /opt/oracle/oradata/.cantomoda-inicializado
