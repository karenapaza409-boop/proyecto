param([switch]$Aplicar)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Push-Location $taskRoot
try {
    $taskScript = if ($Aplicar) { '04_proveedores.sql' } else { '03_proveedores_preflight.sql' }
    $taskSql = "WHENEVER OSERROR EXIT FAILURE`nWHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK`nALTER SESSION SET CONTAINER=FREEPDB1;`n@/opt/cantomoda/migrations/$taskScript`nEXIT;`n"
    $taskSql | & docker compose exec -T oracle sqlplus -L -s / as sysdba
    if ($LASTEXITCODE -ne 0) { throw 'La comprobación/migración se detuvo. Revise el motivo sin eliminar ni fusionar registros.' }
} finally { Pop-Location }
