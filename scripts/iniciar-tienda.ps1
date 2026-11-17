$ErrorActionPreference = 'Stop'
$taskProject = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $taskProject

function Test-TiendaUrl([string]$Url) {
    try {
        $taskResponse = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $taskResponse.StatusCode -eq 200
    } catch { return $false }
}

try {
    Write-Host 'Iniciando Canto Moda... Docker Desktop debe estar abierto.'
    & docker compose up -d --wait --wait-timeout 180
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar la infraestructura. Abra Docker Desktop y vuelva a intentarlo.' }

    $taskLogs = Join-Path $taskProject 'logs'
    New-Item -ItemType Directory -Path $taskLogs -Force | Out-Null

    if (!(Test-TiendaUrl 'http://localhost:8080/actuator/health')) {
        Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $taskProject `
            -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f (Join-Path $PSScriptRoot 'backend.ps1'))) `
            -RedirectStandardOutput (Join-Path $taskLogs 'backend.log') `
            -RedirectStandardError (Join-Path $taskLogs 'backend-error.log') | Out-Null
    }

    if (!(Test-TiendaUrl 'http://localhost:4201')) {
        if (!(Test-Path -LiteralPath (Join-Path $taskProject 'frontend/node_modules'))) {
            Push-Location (Join-Path $taskProject 'frontend')
            try {
                & npm.cmd ci
                if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias de la web.' }
            } finally { Pop-Location }
        }
        Start-Process -FilePath 'cmd.exe' -WindowStyle Hidden -WorkingDirectory (Join-Path $taskProject 'frontend') `
            -ArgumentList @('/c', 'npm.cmd start') `
            -RedirectStandardOutput (Join-Path $taskLogs 'frontend.log') `
            -RedirectStandardError (Join-Path $taskLogs 'frontend-error.log') | Out-Null
    }

    Write-Host 'Esperando la web, la API y el acceso de usuarios...'
    $taskReady = $false
    for ($taskAttempt = 0; $taskAttempt -lt 90; $taskAttempt++) {
        if ((Test-TiendaUrl 'http://localhost:4201') -and
            (Test-TiendaUrl 'http://localhost:8080/actuator/health') -and
            (Test-TiendaUrl 'http://localhost:38081/realms/cantomoda/.well-known/openid-configuration')) {
            $taskReady = $true
            break
        }
        Start-Sleep -Seconds 2
    }
    if (!$taskReady) { throw 'El arranque no termino a tiempo. Revise los archivos de la carpeta logs.' }
    Start-Process 'http://localhost:4201' -WindowStyle Hidden
    Write-Host 'Canto Moda esta lista: http://localhost:4201'
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
