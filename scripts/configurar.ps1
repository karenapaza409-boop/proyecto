$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskEnv = Join-Path $taskRoot '.env'
if (Test-Path -LiteralPath $taskEnv) {
    Write-Host '.env ya existe: se conserva sin cambios.'
    exit 0
}
$taskTemplate = [IO.File]::ReadAllText((Join-Path $taskRoot '.env.example'))
$taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
    foreach ($taskKey in 'ORACLE_PASSWORD','DB_PASSWORD','POSTGRES_PASSWORD','KEYCLOAK_ADMIN_PASSWORD') {
        $taskBytes = New-Object byte[] 32
        $taskRng.GetBytes($taskBytes)
        $taskSecret = [BitConverter]::ToString($taskBytes).Replace('-', '')
        $taskTemplate = [regex]::Replace($taskTemplate, "(?m)^${taskKey}=.*$", "${taskKey}=$taskSecret")
    }
    # CreateNew impide sobrescribir un archivo creado mientras se generaban las claves.
    $taskStream = [IO.File]::Open($taskEnv, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
    try {
        $taskContent = [Text.UTF8Encoding]::new($false).GetBytes($taskTemplate)
        $taskStream.Write($taskContent, 0, $taskContent.Length)
    } finally { $taskStream.Dispose() }
} finally { $taskRng.Dispose() }
Write-Host '.env creado con secretos locales. No publique este archivo.'
