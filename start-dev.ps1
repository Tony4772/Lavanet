# Script de desarrollo para LAVANET Multitenant
# Inicia tanto el backend como el frontend en modo desarrollo

Write-Host "🚀 Iniciando sistema LAVANET Multitenant..." -ForegroundColor Cyan

# 1. Iniciar MongoDB (si no está corriendo)
Write-Host "📊 Verificando MongoDB..." -ForegroundColor Yellow
$mongoStatus = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if (-not $mongoStatus) {
    Write-Host "⚠️ MongoDB service no encontrado. Por favor inícielo manualmente." -ForegroundColor Red
    Write-Host "   Descarga e instala: https://www.mongodb.com/try/download/database" -ForegroundColor Gray
} else {
    Start-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    Write-Host "✅ MongoDB iniciado" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# 2. Iniciar Backend
Write-Host "🔧 Iniciando Backend API..." -ForegroundColor Yellow
Set-Location "D:\AndroidStudioProjects\Lavanet\backend"
$backendCmd = & powershell -Command "npm start" 2>&1 &
$backendPID = $lastexitcode

# Wait for backend to start
Start-Sleep -Seconds 3

# 3. Iniciar Frontend
Write-Host "⚛️ Iniciando Frontend..." -ForegroundColor Yellow
Set-Location "D:\AndroidStudioProjects\Lavanet\frontend"
$frontendCmd = & powershell -Command "npm start" 2>&1 &
$frontendPID = $lastexitcode

Write-Host ""
Write-Host "=" * 60
Write-Host "🌐 SISTEMA LISTO - LAVANET Multitenant" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "Backend API:      http://localhost:5000"
Write-Host "Frontend UI:      http://localhost:3000"
Write-Host "Health Check:     http://localhost:5000/api/health"
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor DarkYellow
Write-Host "  - Admin: admin / admin123" -ForegroundColor Gray
Write-Host "  - Cajero: cajero / cajero123" -ForegroundColor Gray
Write-Host "  - Recepción: recepcion / recepcion123" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener: Ctrl+C" -ForegroundColor Gray
Write-Host "=" * 60

# Keep script running
Do {
    Start-Sleep -Seconds 30
} Until ($false)