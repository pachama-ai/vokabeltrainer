# deploy.ps1 — Vokabeltrainer auf xenia.rabbarien.de deployen
# Ausfuehren in PowerShell: .\deploy.ps1
# Voraussetzung: Windows 10/11 (OpenSSH eingebaut, kein extra Download noetig)

$SERVER = "xenia@xenia.rabbarien.de"
$REMOTE = "/var/www/xenia"

Write-Host "=== 1. Frontend bauen ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=== 2. Frontend hochladen (dist/) ===" -ForegroundColor Cyan
Write-Host "-> Passwort eingeben wenn gefragt: ichbinxenia" -ForegroundColor Yellow
scp -r -o StrictHostKeyChecking=accept-new "dist/." "${SERVER}:${REMOTE}/"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload fehlgeschlagen!" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=== Fertig! App erreichbar unter: https://xenia.rabbarien.de ===" -ForegroundColor Green
