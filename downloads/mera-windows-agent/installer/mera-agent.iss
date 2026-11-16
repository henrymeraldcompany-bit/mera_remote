; Script generated for Inno Setup Compiler
; MERA Remote Management - Windows Agent

#define MyAppName "MERA Remote Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "MERA Systems"
#define MyAppURL "https://mera.io"
#define MyAppExeName "mera-agent.bat"

[Setup]
AppId={{D9B40316-43BA-4A3C-9B3B-8C488F3A2254}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\MERA\Agent
DisableDirPage=no
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=no
OutputDir=..\..\website\downloads
OutputBaseFilename=MERA-Agent-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startuptask"; Description: "Register legitimate Windows background startup task"; GroupDescription: "Background Operation"

[Files]
Source: "..\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "setup.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "uninstall.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName} Console"; Filename: "cmd.exe"; Parameters: "/k ""{app}\mera-agent.bat"" --dashboard"; WorkingDir: "{app}"
Name: "{group}\Enroll Device"; Filename: "cmd.exe"; Parameters: "/k ""{app}\mera-agent.bat"" --pair"; WorkingDir: "{app}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "cmd.exe"; Parameters: "/k ""{app}\mera-agent.bat"" --dashboard"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "cmd.exe"; Parameters: "/c echo @echo off>""{app}\mera-agent.bat"" && echo node ""%~dp0dist\index.js"" %*>>""{app}\mera-agent.bat"""; Flags: runhidden
Filename: "schtasks.exe"; Parameters: "/create /tn ""MeraRemoteAgent"" /tr ""\""{app}\mera-agent.bat\"" --background"" /sc onlogon /rl limited /f"; Tasks: startuptask; Flags: runhidden
Filename: "{app}\mera-agent.bat"; Parameters: "--pair"; Description: "Launch Device Enrollment Wizard now"; Flags: postinstall nowait skipifsilent
