@echo off
chcp 65001 >nul
title Servidor EEMM - Gestion de Equipos Medicos

echo ==============================================================================
echo           EEMM - GESTION DE EQUIPOS MEDICOS Y CHEQUEOS PREVENTIVOS
echo ==============================================================================
echo.
echo Iniciando el servidor local EEMM...
echo.

cd /d "c:\Users\patro\OneDrive\Documentos\EEMM"

set "UV_BIN=C:\Users\patro\.gemini\antigravity\bin\uv.exe"

if not exist "%UV_BIN%" (
    where uv >nul 2>nul
    if %errorlevel% equ 0 (
        set "UV_BIN=uv"
    ) else (
        echo [ERROR] No se encontro uv.exe para ejecutar Python.
        pause
        exit /b 1
    )
)

echo Abriendo navegador en http://localhost:8000 ...
start "" "http://localhost:8000"

echo Servidor activo en el puerto 8000.
echo Presiona Ctrl + C en esta ventana para detener el servidor.
echo.

"%UV_BIN%" run --with fastapi --with uvicorn --with python-multipart --with reportlab --with pillow python app.py

pause
