@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install it from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$url = 'http://127.0.0.1:4173/'; $response = $null; try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 } catch {}; if (-not $response) { Start-Process -FilePath 'node' -ArgumentList 'server.mjs' -WorkingDirectory '%~dp0' -WindowStyle Hidden; for ($i = 0; $i -lt 20 -and -not $response; $i++) { Start-Sleep -Milliseconds 200; try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 } catch {} } }; if (-not $response -or $response.Content -notmatch 'spell-desk') { Write-Host 'Could not start the game on port 4173. Check whether another application is using it.'; exit 1 }"
if errorlevel 1 pause
if errorlevel 1 exit /b 1
start "" "http://localhost:4173/"
