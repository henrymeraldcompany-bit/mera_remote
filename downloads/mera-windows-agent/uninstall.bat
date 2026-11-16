@echo off
setlocal enabledelayedexpansion
title MERA Remote Management - Uninstaller

echo =================================================================
echo    MERA REMOTE MANAGEMENT - WINDOWS AGENT UNINSTALLER
echo =================================================================
echo.

set /p CONFIRM="Are you sure you want to uninstall MERA Agent from this computer? (yes/no): "
if /i not "%CONFIRM:~0,1%"=="y" (
    echo Uninstallation cancelled.
    pause
    exit /b 0
)

echo.
echo 1/3 Removing Windows background startup task...
schtasks /delete /tn "MeraRemoteAgent" /f >nul 2>&1
echo    Task removed.

echo 2/3 Removing Start Menu shortcuts...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\MERA Remote Management" (
    rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\MERA Remote Management" >nul 2>&1
)
echo    Shortcuts removed.

set /p PURGE="Do you want to permanently erase your device identity and credentials? (yes/no): "
if /i "%PURGE:~0,1%"=="y" (
    echo 3/3 Purging credentials and configuration...
    if exist "%LOCALAPPDATA%\MERA" (
        rmdir /s /q "%LOCALAPPDATA%\MERA" >nul 2>&1
    )
    if exist "%USERPROFILE%\.mera" (
        rmdir /s /q "%USERPROFILE%\.mera" >nul 2>&1
    )
    echo    Credentials wiped.
) else (
    echo 3/3 Retaining credentials for future re-installation.
    if exist "%LOCALAPPDATA%\MERA\Agent" (
        rmdir /s /q "%LOCALAPPDATA%\MERA\Agent" >nul 2>&1
    )
)

echo.
echo =================================================================
echo          MERA WINDOWS AGENT UNINSTALLED SUCCESSFULLY
echo =================================================================
pause
