-- Migración incremental e idempotente para MM_CATALOGO.CATEGORIAS
DECLARE
  n NUMBER;
  PROCEDURE columna(nombre VARCHAR2, definicion VARCHAR2) IS
  BEGIN
    SELECT COUNT(*) INTO n FROM all_tab_columns
      WHERE owner='MM_CATALOGO' AND table_name='CATEGORIAS' AND column_name=nombre;
    IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_CATALOGO.CATEGORIAS ADD ('||definicion||')'; END IF;
  END;
BEGIN
  columna('DESCRIPCION','descripcion VARCHAR2(250 CHAR)');
  columna('ACTIVO','activo NUMBER(1) DEFAULT 1 NOT NULL');
END;
/
DECLARE
  n NUMBER;
BEGIN
  SELECT COUNT(*) INTO n FROM all_constraints WHERE owner='MM_CATALOGO' AND constraint_name='CK_CAT_ACTIVO';
  IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE MM_CATALOGO.CATEGORIAS ADD CONSTRAINT CK_CAT_ACTIVO CHECK(activo IN (0,1))'; END IF;
END;
/
COMMIT;
PROMPT Migracion de categorias completada.
