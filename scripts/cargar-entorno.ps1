$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskEnv = Join-Path $taskRoot '.env'
if (!(Test-Path -LiteralPath $taskEnv)) { throw 'Falta .env. Ejecute scripts/configurar.ps1.' }
foreach ($taskLine in [IO.File]::ReadAllLines($taskEnv)) {
    if ($taskLine -match '^\s*([A-Z][A-Z0-9_]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(), 'Process')
    }
}
