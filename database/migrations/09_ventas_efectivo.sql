SET DEFINE OFF
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
DECLARE n NUMBER;
 PROCEDURE agregar(nombre VARCHAR2,definicion VARCHAR2) IS BEGIN
 SELECT COUNT(*) INTO n FROM all_tab_columns WHERE owner='MM_VENTAS' AND table_name='VENTAS' AND column_name=nombre;
 IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_VENTAS.VENTAS ADD ('||definicion||')'; END IF; END;
BEGIN
 agregar('CLAVE_OPERACION','clave_operacion VARCHAR2(36 CHAR)');
 agregar('HUELLA_SOLICITUD','huella_solicitud VARCHAR2(64 CHAR)');
 agregar('EFECTIVO_RECIBIDO','efectivo_recibido NUMBER(14,2)');
 agregar('VUELTO','vuelto NUMBER(14,2)');
 agregar('CAJERO_NOMBRE','cajero_nombre VARCHAR2(150 CHAR)');
END;
/
DECLARE n NUMBER;BEGIN
 SELECT COUNT(*) INTO n FROM (SELECT clave_operacion FROM MM_VENTAS.VENTAS WHERE clave_operacion IS NOT NULL GROUP BY clave_operacion HAVING COUNT(*)>1);
 IF n>0 THEN RAISE_APPLICATION_ERROR(-20091,'Hay claves de venta duplicadas. Revisar manualmente; no se eliminan ni fusionan ventas.');END IF;
 SELECT COUNT(*) INTO n FROM all_indexes WHERE owner='MM_VENTAS' AND index_name='UQ_VENTA_CLAVE';
 IF n=0 THEN EXECUTE IMMEDIATE 'CREATE UNIQUE INDEX MM_VENTAS.UQ_VENTA_CLAVE ON MM_VENTAS.VENTAS(clave_operacion)';END IF;
 SELECT COUNT(*) INTO n FROM all_constraints WHERE owner='MM_VENTAS' AND constraint_name='CK_VENTA_EFECTIVO';
 IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_VENTAS.VENTAS ADD CONSTRAINT CK_VENTA_EFECTIVO CHECK ((efectivo_recibido IS NULL AND vuelto IS NULL) OR (efectivo_recibido IS NOT NULL AND vuelto IS NOT NULL AND efectivo_recibido>=total AND vuelto>=0 AND vuelto=efectivo_recibido-total))';END IF;
END;
/
COMMIT;
-- Ventas anteriores permanecen con pago/clave NULL: no se inventan cobros históricos.
