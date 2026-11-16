@echo off
setlocal enabledelayedexpansion
title MERA Remote Management - Windows Agent Installer

echo =================================================================
echo    MERA REMOTE MANAGEMENT - WINDOWS AGENT INSTALLER
echo =================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found on your system PATH.
    echo Please install Node.js from https://nodejs.org and re-run this setup.
    pause
    exit /b 1
)

:: Run PowerShell installer bypassing execution policy restrictions
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [!] Setup exited with code %errorlevel%.
    pause
    exit /b %errorlevel%
)

pause
