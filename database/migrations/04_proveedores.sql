-- Migración incremental e idempotente. No contiene DROP, DELETE, TRUNCATE ni clasificación inferida.
-- Oracle hace commit implícito en DDL: aplicar con backend detenido y respaldo verificado.
@@03_proveedores_preflight.sql
DECLARE
  n NUMBER;
  PROCEDURE columna(nombre VARCHAR2, definicion VARCHAR2) IS
  BEGIN
    SELECT COUNT(*) INTO n FROM all_tab_columns
      WHERE owner='MM_COMPRAS' AND table_name='PROVEEDORES' AND column_name=nombre;
    IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_COMPRAS.PROVEEDORES ADD ('||definicion||')'; END IF;
  END;
BEGIN
  columna('TIPO_DOCUMENTO','tipo_documento VARCHAR2(3 CHAR)');
  columna('NOMBRE_COMERCIAL','nombre_comercial VARCHAR2(150 CHAR)');
  columna('PERSONA_CONTACTO','persona_contacto VARCHAR2(150 CHAR)');
  columna('TELEFONO','telefono VARCHAR2(30 CHAR)');
  columna('CORREO','correo VARCHAR2(254 CHAR)');
  columna('DIRECCION','direccion VARCHAR2(250 CHAR)');
  -- Antes todos estaban disponibles para comprar: activo=1 mantiene ese comportamiento.
  columna('ACTIVO','activo NUMBER(1) DEFAULT 1 NOT NULL');
END;
/
DECLARE
  n NUMBER;
BEGIN
  SELECT COUNT(*) INTO n FROM all_constraints WHERE owner='MM_COMPRAS' AND constraint_name='CK_PROV_ACTIVO';
  IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_COMPRAS.PROVEEDORES ADD CONSTRAINT CK_PROV_ACTIVO CHECK(activo IN (0,1))'; END IF;
  SELECT COUNT(*) INTO n FROM all_constraints WHERE owner='MM_COMPRAS' AND constraint_name='CK_PROV_DOCUMENTO';
  IF n=0 THEN EXECUTE IMMEDIATE q'~ALTER TABLE MM_COMPRAS.PROVEEDORES ADD CONSTRAINT CK_PROV_DOCUMENTO
    CHECK(tipo_documento IS NULL OR (tipo_documento='DNI' AND REGEXP_LIKE(documento,'^[0-9]{8}$'))
      OR (tipo_documento='RUC' AND REGEXP_LIKE(documento,'^[0-9]{11}$')))~'; END IF;
  SELECT COUNT(*) INTO n FROM all_indexes WHERE owner='MM_COMPRAS' AND index_name='UQ_PROV_TIPO_DOC_NORM';
  IF n=0 THEN EXECUTE IMMEDIATE q'~CREATE UNIQUE INDEX MM_COMPRAS.UQ_PROV_TIPO_DOC_NORM
    ON MM_COMPRAS.PROVEEDORES(NVL(tipo_documento,'SIN_CLASIFICAR'),TRIM(documento))~'; END IF;
  SELECT COUNT(*) INTO n FROM all_indexes WHERE owner='MM_COMPRAS' AND index_name='UQ_PROV_TIPO_DOC_NORM'
    AND table_owner='MM_COMPRAS' AND table_name='PROVEEDORES' AND uniqueness='UNIQUE' AND status='VALID';
  IF n<>1 THEN RAISE_APPLICATION_ERROR(-20033,'Verifique el indice UQ_PROV_TIPO_DOC_NORM antes de continuar.'); END IF;
  SELECT COUNT(*) INTO n FROM all_indexes WHERE owner='MM_COMPRAS' AND index_name='IX_COMPRA_PROVEEDOR_FECHA';
  IF n=0 THEN EXECUTE IMMEDIATE 'CREATE INDEX MM_COMPRAS.IX_COMPRA_PROVEEDOR_FECHA ON MM_COMPRAS.COMPRAS(proveedor_id,fecha DESC,id DESC)'; END IF;
END;
/
COMMIT;
PROMPT Migracion de proveedores completada. Tipos de documentos anteriores y contactos faltantes permanecen NULL.
