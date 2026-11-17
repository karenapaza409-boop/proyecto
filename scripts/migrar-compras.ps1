param([switch]$Aplicar)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskDocker = (Get-Command docker -ErrorAction SilentlyContinue).Source
if (!$taskDocker) { $taskDocker = Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe' }
if (!(Test-Path -LiteralPath $taskDocker)) { throw 'Docker CLI no disponible.' }
Push-Location $taskRoot
try {
    $taskSql = "WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK`nALTER SESSION SET CONTAINER=FREEPDB1;`n"
    if ($Aplicar) { $taskSql += [IO.File]::ReadAllText((Join-Path $taskRoot 'database/migrations/05_compras_recepcion.sql')) }
    $taskSql += "`nSELECT COUNT(*) AS compras_actuales FROM MM_COMPRAS.COMPRAS;`nSELECT column_name FROM all_tab_columns WHERE owner='MM_COMPRAS' AND table_name='COMPRAS' AND column_name IN ('FECHA_RECEPCION','TIPO_COMPROBANTE','SERIE','NUMERO','OBSERVACIONES');`nEXIT;`n"
    $taskSql | & $taskDocker compose exec -T oracle sqlplus -L -s / as sysdba
    if ($LASTEXITCODE -ne 0) { throw 'La comprobación/migración se detuvo. No elimine datos para resolver el fallo.' }
} finally { Pop-Location }
