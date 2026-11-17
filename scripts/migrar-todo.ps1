param([switch]$Aplicar)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskDocker=(Get-Command docker -ErrorAction SilentlyContinue).Source
if(!$taskDocker){$taskDocker=Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe'}
if(!(Test-Path -LiteralPath $taskDocker)){throw 'Docker CLI no disponible.'}
Push-Location $taskRoot
try {
  Write-Host "Verificando y aplicando migraciones incrementales en Oracle..." -ForegroundColor Cyan
  
  $taskSql="WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK`nALTER SESSION SET CONTAINER=FREEPDB1;`n"
  
  if ($Aplicar) {
    # 07 Clientes
    if (Test-Path 'database/migrations/07_clientes.sql') {
      $taskSql += [IO.File]::ReadAllText((Join-Path $taskRoot 'database/migrations/07_clientes.sql')) + "`n"
    }
    # 08 Categorías
    if (Test-Path 'database/migrations/08_categorias.sql') {
      $taskSql += [IO.File]::ReadAllText((Join-Path $taskRoot 'database/migrations/08_categorias.sql')) + "`n"
    }
    # 09 Ventas
    if (Test-Path 'database/migrations/09_ventas_efectivo.sql') {
      $taskSql += [IO.File]::ReadAllText((Join-Path $taskRoot 'database/migrations/09_ventas_efectivo.sql')) + "`n"
    }
  } else {
    $taskSql += "SELECT 'Oracle listo' AS estado FROM DUAL;`n"
  }
  
  $taskSql += "EXIT;`n"
  $taskSql | & $taskDocker compose exec -T oracle sqlplus -L -s / as sysdba
  if($LASTEXITCODE -ne 0){throw 'Error en ejecución de migraciones.'}
  Write-Host "Migraciones completadas exitosamente." -ForegroundColor Green
}finally{Pop-Location}
