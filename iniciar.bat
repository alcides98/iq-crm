@echo off
title IQ-CRM - Inicio de servicios
echo.
echo  ========================================
echo   IQ-CRM ^| Wolf Consulting Group
echo   Levantando servicios locales...
echo  ========================================
echo.

REM ── Docker (PostgreSQL 5433 + Redis 6380) ──────────────────
echo [1/3] Verificando Docker...
docker ps --filter "name=wolf-crm" --format "{{.Names}} {{.Status}}" 2>nul | findstr /i "wolf-crm" >nul
if %errorlevel% neq 0 (
    echo       Iniciando contenedores Docker...
    cd /d "%~dp0"
    docker compose up -d db redis
    timeout /t 4 /nobreak >nul
) else (
    echo       Docker OK (postgres:5433, redis:6380)
)

REM ── Django backend (127.0.0.1:8000) ────────────────────────
echo [2/3] Iniciando Django backend...
netstat -ano | findstr "127.0.0.1:8000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo       Django ya esta corriendo en puerto 8000
) else (
    start "IQ-CRM Backend" /D "%~dp0backend" cmd /k "venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"
    echo       Django iniciando en http://127.0.0.1:8000
)

REM ── Vite frontend (localhost:3001) ──────────────────────────
echo [3/3] Iniciando Vite frontend...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo       Vite ya esta corriendo en puerto 3001
) else (
    start "IQ-CRM Frontend" /D "%~dp0frontend" cmd /k "npm run dev"
    echo       Vite iniciando en http://localhost:3001
)

echo.
echo  ========================================
echo   Acceso: http://localhost:3001
echo   Usuario: acardozo@iqdata.com.py
echo  ========================================
echo.
echo  NOTA: Si otro proyecto usa puerto 8000,
echo  cerrar su backend antes de iniciar este.
echo.
pause