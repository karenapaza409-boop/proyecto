param([switch]$Aplicar)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskDocker=(Get-Command docker -ErrorAction SilentlyContinue).Source
if(!$taskDocker){$taskDocker=Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe'}
if(!(Test-Path -LiteralPath $taskDocker)){throw 'Docker CLI no disponible.'}
Push-Location $taskRoot
try {
  $taskSql="WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK`nALTER SESSION SET CONTAINER=FREEPDB1;`nSELECT COUNT(*) AS categorias FROM MM_CATALOGO.CATEGORIAS;`n"
  if($Aplicar){$taskSql+=[IO.File]::ReadAllText((Join-Path $taskRoot 'database/migrations/08_categorias.sql'))}
  $taskSql+="`nEXIT;`n"
  $taskSql | & $taskDocker compose exec -T oracle sqlplus -L -s / as sysdba
  if($LASTEXITCODE -ne 0){throw 'Error aplicando migración de categorías.'}
}finally{Pop-Location}
