$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'cargar-entorno.ps1')
Push-Location (Join-Path $taskRoot 'backend')
try { & .\mvnw.cmd spring-boot:run; $taskExit = $LASTEXITCODE }
finally { Pop-Location }
exit $taskExit
