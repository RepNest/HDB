
# Initial_ADUC_Setup.ps1

$ScriptPath = "C:\Scripts"
$LauncherPath = "$ScriptPath\ADUC_Launcher.ps1"

# If ADUC_Launcher.ps1 exists, just launch it and exit
if (Test-Path $LauncherPath) {
    Write-Host "ADUC_Launcher.ps1 already exists. Launching now..."
    Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$LauncherPath`""
    exit
}

# If not, continue with initial setup
$CredFile = "$env:USERPROFILE\ad_cred.xml"
$MaxAgeDays = 30
$IsValid = $false

# Ensure Scripts directory exists
if (-not (Test-Path $ScriptPath)) {
    New-Item -ItemType Directory -Path $ScriptPath | Out-Null
    Write-Host "Created C:\Scripts folder"
}

# Generate ADUC_Launcher.ps1 content
$LauncherScript = @"
`$CredFile = "`$env:USERPROFILE\ad_cred.xml"
`$MaxAgeDays = 30

if (-not (Test-Path `$CredFile)) {
    Write-Host "No stored credentials found. Please run the setup script first."
    Start-Sleep -Seconds 10
    Exit
}

`$Cred = Import-Clixml -Path `$CredFile
`$Username = `$Cred.UserName

if ((Get-Item `$CredFile).LastWriteTime -lt (Get-Date).AddDays(-`$MaxAgeDays)) {
    Write-Host "Stored credentials are older than `$MaxAgeDays days. Please refresh them."
    (Get-Credential -UserName `$Username) | Export-Clixml -Path `$CredFile
    `$Cred = Import-Clixml -Path `$CredFile
}

try {
    Import-Module ActiveDirectory -ErrorAction Stop
    `$ShortUser = `$Username.Split("\")[-1]
    `$ADUser = Get-ADUser -Identity `$ShortUser -Properties PasswordExpired
    if (`$ADUser.PasswordExpired) {
        Write-Host "Password for `$Username is expired. Go to https://icloud.miamidade.gov to update."
        Start-Sleep -Seconds 15
        Exit
    }
} catch {
    Write-Host "Skipping AD module or password check."
}

try {
    Start-Process mmc.exe "C:\WINDOWS\system32\dsa.msc" -Credential `$Cred -ErrorAction Stop
    Write-Host "ADUC launched successfully as `$Username."
} catch {
    Write-Host "Failed to launch ADUC. Please re-enter credentials."
    (Get-Credential -UserName `$Username) | Export-Clixml -Path `$CredFile
}
"@

# Write launcher to file
$LauncherScript | Out-File -FilePath $LauncherPath -Encoding UTF8
Write-Host "✅ ADUC_Launcher.ps1 written to $LauncherPath"

# Prompt for credential and validate
Import-Module ActiveDirectory -ErrorAction SilentlyContinue

do {
    $Username = Read-Host "Enter the domain username (example: miamidade\e315170_2)"
    $Credential = Get-Credential -UserName $Username

    try {
        $context = New-Object System.DirectoryServices.DirectoryEntry("", $Credential.UserName, $Credential.GetNetworkCredential().Password)
        $null = $context.NativeObject
        Write-Host "✅ Credentials validated successfully."
        $IsValid = $true
    } catch {
        Write-Host "❌ Invalid credentials or unable to bind to AD. Please try again."
    }
} until ($IsValid)

$Credential | Export-Clixml -Path $CredFile
Write-Host "✅ Credential saved securely to $CredFile"

# Create desktop shortcut
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Launch ADUC.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$LauncherPath`""
$Shortcut.WorkingDirectory = $ScriptPath
$Shortcut.WindowStyle = 1
$Shortcut.Description = "Launch Active Directory Users & Computers with stored credentials"
$Shortcut.Save()
Write-Host "✅ Desktop shortcut created"
