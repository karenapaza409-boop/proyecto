param([switch]$Aplicar)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskDocker=(Get-Command docker -ErrorAction SilentlyContinue).Source
if(!$taskDocker){$taskDocker=Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe'}
if(!(Test-Path -LiteralPath $taskDocker)){throw 'Docker CLI no disponible.'}
Push-Location $taskRoot
try{
 $taskSql="WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK`nALTER SESSION SET CONTAINER=FREEPDB1;`nSELECT COUNT(*) AS clientes FROM MM_VENTAS.CLIENTES;`nSELECT COUNT(*) AS grupos_duplicados FROM (SELECT TRIM(documento) FROM MM_VENTAS.CLIENTES GROUP BY TRIM(documento) HAVING COUNT(*)>1);`n"
 if($Aplicar){$taskSql+=[IO.File]::ReadAllText((Join-Path $taskRoot 'database/migrations/08_clientes_identificacion.sql'))}
 $taskSql+="`nEXIT;`n";$taskSql | & $taskDocker compose exec -T oracle sqlplus -L -s / as sysdba
 if($LASTEXITCODE -ne 0){throw 'Revisión/migración detenida. No borre ni fusione clientes para superar el diagnóstico.'}
}finally{Pop-Location}
