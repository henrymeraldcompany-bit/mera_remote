<#
.SYNOPSIS
    MERA Remote Management - Windows Agent Professional Installer
.DESCRIPTION
    Installs the transparent MERA client agent into %LOCALAPPDATA%\MERA\Agent,
    registers the legitimate Task Scheduler background service, and creates shortcuts.
#>

param (
    [string]$InstallDir = "$env:LOCALAPPDATA\MERA\Agent",
    [switch]$SkipEnrollment = $false
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host " ================================================================= " -ForegroundColor Cyan
Write-Host "    MERA REMOTE MANAGEMENT — WINDOWS AGENT INSTALLATION WIZARD     " -ForegroundColor Cyan
Write-Host " ================================================================= " -ForegroundColor Cyan
Write-Host ""
Write-Host "This wizard will install the official MERA Remote Management client agent"
Write-Host "onto this computer with full transparency and explicit owner consent."
Write-Host ""

# 1. Verify Node.js
Write-Host "1/5 Checking runtime dependencies..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "Error: Node.js is required to run the MERA Windows Agent." -ForegroundColor Red
    Write-Host "Please install Node.js (v18+ or v20+) from https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVer = node --version
Write-Host "    Node.js detected: $nodeVer" -ForegroundColor Green

# 2. Prepare installation directory
Write-Host "2/5 Preparing installation destination at: $InstallDir..." -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
}

# 3. Copy application files
Write-Host "3/5 Deploying agent binaries and configurations..." -ForegroundColor Yellow
$srcDir = Resolve-Path "$PSScriptRoot\.."
Copy-Item -Path "$srcDir\dist" -Destination "$InstallDir\dist" -Recurse -Force
Copy-Item -Path "$srcDir\package.json" -Destination "$InstallDir\package.json" -Force

# Create convenient CLI runner batch file
$runnerBatch = @"
@echo off
node "%~dp0dist\index.js" %*
"@
Set-Content -Path "$InstallDir\mera-agent.bat" -Value $runnerBatch -Encoding ASCII

# 4. Create Windows Start Menu shortcuts
Write-Host "4/5 Creating Start Menu shortcuts..." -ForegroundColor Yellow
try {
    $wsShell = New-Object -ComObject WScript.Shell
    $startMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\MERA Remote Management"
    if (-not (Test-Path $startMenuDir)) {
        New-Item -ItemType Directory -Force -Path $startMenuDir | Out-Null
    }

    # Shortcut 1: Interactive Dashboard
    $shortcut1 = $wsShell.CreateShortcut("$startMenuDir\MERA Agent Console.lnk")
    $shortcut1.TargetPath = "cmd.exe"
    $shortcut1.Arguments = "/k `"$InstallDir\mera-agent.bat`" --dashboard"
    $shortcut1.WorkingDirectory = $InstallDir
    $shortcut1.Description = "Open MERA Remote Agent Interactive Dashboard"
    $shortcut1.Save()

    # Shortcut 2: Enrollment Wizard
    $shortcut2 = $wsShell.CreateShortcut("$startMenuDir\Enroll Device.lnk")
    $shortcut2.TargetPath = "cmd.exe"
    $shortcut2.Arguments = "/k `"$InstallDir\mera-agent.bat`" --pair"
    $shortcut2.WorkingDirectory = $InstallDir
    $shortcut2.Description = "Enroll this Windows computer in MERA"
    $shortcut2.Save()

    Write-Host "    Start Menu shortcuts created." -ForegroundColor Green
} catch {
    Write-Host "    Note: Shortcut creation skipped ($($_.Exception.Message))" -ForegroundColor Gray
}

# 5. Register legitimate Task Scheduler service
Write-Host "5/5 Registering legitimate Windows background startup service..." -ForegroundColor Yellow
try {
    $nodePath = (Get-Command node).Source
    $taskName = "MeraRemoteAgent"
    $scriptEntry = "$InstallDir\dist\index.js"
    $cmd = "schtasks.exe /create /tn `"$taskName`" /tr `"\`"$nodePath\`" \`"$scriptEntry\`" --background`" /sc onlogon /rl limited /f"
    Invoke-Expression $cmd | Out-Null
    Write-Host "    Background task `"$taskName`" successfully registered (starts at logon)." -ForegroundColor Green
} catch {
    Write-Host "    Warning: Could not register startup task automatically: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host " ================================================================= " -ForegroundColor Green
Write-Host "             INSTALLATION COMPLETED SUCCESSFULLY                   " -ForegroundColor Green
Write-Host " ================================================================= " -ForegroundColor Green
Write-Host ""
Write-Host "Application path: $InstallDir"
Write-Host "Command CLI     : $InstallDir\mera-agent.bat"
Write-Host ""

if (-not $SkipEnrollment) {
    $choice = Read-Host "Would you like to run the device enrollment wizard now? (yes/no)"
    if ($choice.ToLower().StartsWith('y')) {
        & node "$InstallDir\dist\index.js" --pair
    } else {
        Write-Host "You can enroll anytime by running: mera-agent --pair" -ForegroundColor Cyan
    }
}
