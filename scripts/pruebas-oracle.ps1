param([switch]$ConfirmarBaseDePruebas)
$ErrorActionPreference = 'Stop'
if (!$ConfirmarBaseDePruebas) {
    throw 'La suite inserta datos ficticios persistentes. Use una base de pruebas y -ConfirmarBaseDePruebas. No se borran registros existentes.'
}
. (Join-Path $PSScriptRoot 'cargar-entorno.ps1')
Push-Location (Join-Path $taskRoot 'backend')
try { & .\mvnw.cmd -Poracle-it verify; $taskExit = $LASTEXITCODE }
finally { Pop-Location }
exit $taskExit
