-- Migración incremental e idempotente para MM_VENTAS.CLIENTES
-- Conserva clientes y documentos existentes.
DECLARE
  n NUMBER;
  PROCEDURE columna(nombre VARCHAR2, definicion VARCHAR2) IS
  BEGIN
    SELECT COUNT(*) INTO n FROM all_tab_columns
      WHERE owner='MM_VENTAS' AND table_name='CLIENTES' AND column_name=nombre;
    IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_VENTAS.CLIENTES ADD ('||definicion||')'; END IF;
  END;
BEGIN
  columna('TIPO_DOCUMENTO','tipo_documento VARCHAR2(3 CHAR) DEFAULT ''DNI'' NOT NULL');
  columna('TELEFONO','telefono VARCHAR2(30 CHAR)');
  columna('CORREO','correo VARCHAR2(254 CHAR)');
  columna('ACTIVO','activo NUMBER(1) DEFAULT 1 NOT NULL');
END;
/
DECLARE
  n NUMBER;
BEGIN
  SELECT COUNT(*) INTO n FROM all_constraints WHERE owner='MM_VENTAS' AND constraint_name='CK_CLI_ACTIVO';
  IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_VENTAS.CLIENTES ADD CONSTRAINT CK_CLI_ACTIVO CHECK(activo IN (0,1))'; END IF;

  SELECT COUNT(*) INTO n FROM all_constraints WHERE owner='MM_VENTAS' AND constraint_name='CK_CLI_DOCUMENTO';
  IF n=0 THEN EXECUTE IMMEDIATE q'~ALTER TABLE MM_VENTAS.CLIENTES ADD CONSTRAINT CK_CLI_DOCUMENTO
    CHECK(tipo_documento IS NULL OR (tipo_documento='DNI' AND REGEXP_LIKE(documento,'^[0-9]{8}$'))
      OR (tipo_documento='RUC' AND REGEXP_LIKE(documento,'^[0-9]{11}$')))~'; END IF;

  SELECT COUNT(*) INTO n FROM all_indexes WHERE owner='MM_VENTAS' AND index_name='UQ_CLI_TIPO_DOC_NORM';
  IF n=0 THEN EXECUTE IMMEDIATE q'~CREATE UNIQUE INDEX MM_VENTAS.UQ_CLI_TIPO_DOC_NORM
    ON MM_VENTAS.CLIENTES(NVL(tipo_documento,'DNI'),TRIM(documento))~'; END IF;
END;
/
COMMIT;
PROMPT Migracion de clientes completada.
