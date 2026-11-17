SET DEFINE OFF
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
-- Diagnóstico previo a restricciones: no fusionar ni eliminar duplicados.
DECLARE n NUMBER; BEGIN
 SELECT COUNT(*) INTO n FROM(SELECT TRIM(documento) FROM MM_VENTAS.CLIENTES GROUP BY TRIM(documento) HAVING COUNT(*)>1);
 IF n>0 THEN RAISE_APPLICATION_ERROR(-20081,'Documentos de cliente duplicados tras TRIM. Revisar manualmente; migración detenida.'); END IF;
END;
/
DECLARE n NUMBER;
 PROCEDURE agregar(nombre VARCHAR2,definicion VARCHAR2) IS BEGIN
 SELECT COUNT(*) INTO n FROM all_tab_columns WHERE owner='MM_VENTAS' AND table_name='CLIENTES' AND column_name=nombre;
 IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_VENTAS.CLIENTES ADD ('||definicion||')'; END IF; END;
BEGIN
 agregar('TIPO_DOCUMENTO','tipo_documento VARCHAR2(3 CHAR)');
 agregar('TELEFONO','telefono VARCHAR2(30 CHAR)');
 agregar('CORREO','correo VARCHAR2(254 CHAR)');
 agregar('ACTIVO','activo NUMBER(1) DEFAULT 1 NOT NULL');
 agregar('NOMBRES','nombres VARCHAR2(75 CHAR)');
 agregar('APELLIDOS','apellidos VARCHAR2(75 CHAR)');
 SELECT COUNT(*) INTO n FROM all_indexes WHERE owner='MM_VENTAS' AND index_name='UQ_CLI_DOCUMENTO_TRIM';
 IF n=0 THEN EXECUTE IMMEDIATE 'CREATE UNIQUE INDEX MM_VENTAS.UQ_CLI_DOCUMENTO_TRIM ON MM_VENTAS.CLIENTES(TRIM(documento))'; END IF;
END;
/
COMMIT;
-- No se separa NOMBRE ni se deduce TIPO_DOCUMENTO de datos anteriores.
