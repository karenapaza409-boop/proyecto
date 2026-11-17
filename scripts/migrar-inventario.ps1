param([switch]$Aplicar)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskDocker=(Get-Command docker -ErrorAction SilentlyContinue).Source
if(!$taskDocker){$taskDocker=Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe'}
if(!(Test-Path -LiteralPath $taskDocker)){throw 'Docker CLI no disponible.'}
Push-Location $taskRoot
try {
 $taskSql="WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK`nALTER SESSION SET CONTAINER=FREEPDB1;`nSELECT COUNT(*) AS productos,NVL(SUM(stock),0) AS unidades FROM MM_CATALOGO.PRODUCTOS;`n"
 if($Aplicar){$taskSql+=[IO.File]::ReadAllText((Join-Path $taskRoot 'database/migrations/06_inventario.sql'))}
 $taskSql+="`nEXIT;`n"
 $taskSql | & $taskDocker compose exec -T oracle sqlplus -L -s / as sysdba
 if($LASTEXITCODE -ne 0){throw 'Migración/comprobación detenida. Revise el error, no borre ni fusione registros.'}
}finally{Pop-Location}
