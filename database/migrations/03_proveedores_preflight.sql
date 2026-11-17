-- Solo lectura. Ejecutar en FREEPDB1 como propietario o cuenta de mantenimiento autorizada.
SET DEFINE OFF
SET SERVEROUTPUT ON
WHENEVER OSERROR EXIT FAILURE
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
DECLARE
  tiene_tipo NUMBER;
  duplicados NUMBER;
  invalidos NUMBER;
BEGIN
  SELECT COUNT(*) INTO tiene_tipo FROM all_tab_columns
    WHERE owner='MM_COMPRAS' AND table_name='PROVEEDORES' AND column_name='TIPO_DOCUMENTO';
  IF tiene_tipo=0 THEN
    SELECT COUNT(*) INTO duplicados FROM (
      SELECT TRIM(documento) FROM MM_COMPRAS.PROVEEDORES GROUP BY TRIM(documento) HAVING COUNT(*)>1);
  ELSE
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (SELECT NVL(tipo_documento,''SIN_CLASIFICAR''), TRIM(documento)
      FROM MM_COMPRAS.PROVEEDORES GROUP BY NVL(tipo_documento,''SIN_CLASIFICAR''), TRIM(documento) HAVING COUNT(*)>1)' INTO duplicados;
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM MM_COMPRAS.PROVEEDORES WHERE tipo_documento IS NOT NULL AND NOT (
      (tipo_documento=''DNI'' AND REGEXP_LIKE(documento,''^[0-9]{8}$'')) OR
      (tipo_documento=''RUC'' AND REGEXP_LIKE(documento,''^[0-9]{11}$'')))' INTO invalidos;
    IF invalidos>0 THEN
      RAISE_APPLICATION_ERROR(-20032,'Existen documentos clasificados incompatibles. Revisar manualmente; no se modificaron registros.');
    END IF;
  END IF;
  IF duplicados>0 THEN
    RAISE_APPLICATION_ERROR(-20031,'Existen '||duplicados||' grupos duplicados por tipo/documento normalizado. Detener y revisar manualmente; no se fusionan ni eliminan.');
  END IF;
  DBMS_OUTPUT.PUT_LINE('Preflight proveedores: sin grupos duplicados por tipo/documento normalizado. Tipos antiguos sin clasificar se conservan.');
END;
/
