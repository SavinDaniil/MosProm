$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$installer = Join-Path ([IO.Path]::GetTempPath()) ('ochakovo-python-' + [guid]::NewGuid() + '.exe')
$target = Join-Path $env:LOCALAPPDATA 'OchakovoGame\Python'
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $architecture = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') { 'arm64' } elseif ([Environment]::Is64BitOperatingSystem) { 'amd64' } else { 'win32' }
    $filename = if ($architecture -eq 'win32') { 'python-3.14.8.exe' } else { "python-3.14.8-$architecture.exe" }
    Write-Host 'Downloading Python from python.org...'
    Invoke-WebRequest -UseBasicParsing -Uri "https://www.python.org/ftp/python/3.14.8/$filename" -OutFile $installer
    $signature = Get-AuthenticodeSignature -LiteralPath $installer
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Python Software Foundation(?:,|$)') {
        throw 'Python installer signature verification failed.'
    }
    Write-Host 'Installing Python for this user...'
    $arguments = '/quiet InstallAllUsers=0 Include_launcher=0 Include_test=0 Include_doc=0 Include_pip=0 Include_tcltk=0 Shortcuts=0 AssociateFiles=0 PrependPath=0 TargetDir="' + $target + '"'
    $process = Start-Process -FilePath $installer -ArgumentList $arguments -WindowStyle Hidden -Wait -PassThru
    if ($process.ExitCode -notin @(0, 3010)) { throw "Installer exited with code $($process.ExitCode)." }
    & (Join-Path $target 'python.exe') -c 'import http.server, threading, webbrowser'
    if ($LASTEXITCODE -ne 0) { throw 'Python installation check failed.' }
    Write-Host 'Python is ready.'
} catch {
    Write-Host "Installation failed: $_" -ForegroundColor Red
    exit 1
} finally {
    if (Test-Path -LiteralPath $installer) { Remove-Item -LiteralPath $installer -Force }
}
