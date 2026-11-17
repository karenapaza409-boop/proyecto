$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$sqlPath = Join-Path $root "database/02_tablas_datos.sql"
if (!(Test-Path $sqlPath)) { throw "No se encontro database/02_tablas_datos.sql" }
Push-Location $root
try {
    & docker compose up -d oracle
    if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar el contenedor Oracle." }

    Write-Host "Esperando a que FREEPDB1 acepte conexiones..."
    $ready = $false
    $probe = @'
WHENEVER OSERROR EXIT FAILURE
WHENEVER SQLERROR EXIT FAILURE
ALTER SESSION SET CONTAINER=FREEPDB1;
SELECT 1 FROM dual;
EXIT;
'@
    foreach ($attempt in 1..60) {
        $output = $probe | & docker compose exec -T oracle sqlplus -L -s / as sysdba 2>&1
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 2
    }
    if (!$ready) {
        & docker compose logs --tail 60 oracle
        throw "Oracle no esta disponible. Comparte los logs; no borres los volumenes."
    }
    $validation = @'
DECLARE
  tablas NUMBER;
  relaciones NUMBER;
BEGIN
  SELECT COUNT(*) INTO tablas FROM dba_tables
  WHERE (owner,table_name) IN (
    ('MM_CATALOGO','CATEGORIAS'),('MM_CATALOGO','PRODUCTOS'),
    ('MM_VENTAS','CLIENTES'),('MM_VENTAS','VENTAS'),('MM_VENTAS','DETALLES_VENTA'),
    ('MM_COMPRAS','PROVEEDORES'),('MM_COMPRAS','COMPRAS'),('MM_COMPRAS','DETALLES_COMPRA'),
    ('MM_AUDITORIA','REGISTROS'));
  SELECT COUNT(*) INTO relaciones FROM dba_constraints
  WHERE owner IN ('MM_VENTAS','MM_COMPRAS') AND constraint_type='R'
    AND r_owner='MM_CATALOGO' AND table_name IN ('DETALLES_VENTA','DETALLES_COMPRA');
  IF tablas != 9 OR relaciones != 2 THEN
    RAISE_APPLICATION_ERROR(-20001,'Verificacion incompleta: tablas='||tablas||', FK catalogo='||relaciones);
  END IF;
END;
/
PROMPT VERIFICADO: 9 tablas y 2 relaciones de detalle con el catalogo.
EXIT;
'@
    $sql = "WHENEVER OSERROR EXIT FAILURE`nWHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK`nALTER SESSION SET CONTAINER=FREEPDB1;`n"
    $sql += [IO.File]::ReadAllText($sqlPath) + "`n" + $validation
    Write-Host "Aplicando permisos y completando tablas sin eliminar datos..."
    $sql | & docker compose exec -T oracle sqlplus -L -s / as sysdba
    if ($LASTEXITCODE -ne 0) { throw "La reparacion no termino. Comparte la salida de SQL." }
    & docker compose exec -T oracle touch /opt/oracle/oradata/.cantomoda-inicializado
    if ($LASTEXITCODE -ne 0) { throw "No se pudo actualizar el marcador de inicializacion." }
    Write-Host "Reparacion completada. Espera 15 segundos y consulta docker compose ps."
} finally {
    Pop-Location
}
