-- Aditiva e idempotente: datos anteriores permanecen NULL.
SET DEFINE OFF
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
DECLARE
  n NUMBER;
  PROCEDURE agregar(nombre VARCHAR2, definicion VARCHAR2) IS
  BEGIN
    SELECT COUNT(*) INTO n FROM all_tab_columns WHERE owner='MM_COMPRAS' AND table_name='COMPRAS' AND column_name=nombre;
    IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_COMPRAS.COMPRAS ADD ('||definicion||')'; END IF;
  END;
BEGIN
  agregar('FECHA_RECEPCION','fecha_recepcion DATE');
  agregar('TIPO_COMPROBANTE','tipo_comprobante VARCHAR2(10 CHAR)');
  agregar('SERIE','serie VARCHAR2(20 CHAR)');
  agregar('NUMERO','numero VARCHAR2(20 CHAR)');
  agregar('OBSERVACIONES','observaciones VARCHAR2(1000 CHAR)');
END;
/
COMMIT;
