param(
  [Parameter(Mandatory=$true)][string]$Workspace,
  [Parameter(Mandatory=$true)][string]$NodeExecutable,
  [string]$ChromeExecutable = 'C:\Program Files\Google\Chrome\Application\chrome.exe',
  [string]$Locale = 'zh-TW'
)
$ErrorActionPreference = 'Stop'
if (!(Test-Path $NodeExecutable) -or !(Test-Path $ChromeExecutable)) { throw 'Node or Chrome executable was not found.' }
Push-Location $Workspace
try {
  $env:DISCARDS_CHROME_EXECUTABLE = $ChromeExecutable
  $env:DISCARDS_LOAD_VIA_CDP = '1'
  $logDirectory = Join-Path $Workspace 'artifacts'
  New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
  $outputLog = Join-Path $logDirectory 'windows-stdout.log'
  $errorLog = Join-Path $logDirectory 'windows-stderr.log'
  $process = Start-Process -FilePath $NodeExecutable -ArgumentList @('tests/browser/run.mjs', '--ui', "--locale=$Locale") -WorkingDirectory $Workspace -NoNewWindow -PassThru -Wait -RedirectStandardOutput $outputLog -RedirectStandardError $errorLog
  $testExitCode = $process.ExitCode
  Get-Content $outputLog -Encoding utf8
  Get-Content $errorLog -Encoding utf8
} finally {
  Remove-Item Env:DISCARDS_CHROME_EXECUTABLE -ErrorAction SilentlyContinue
  Remove-Item Env:DISCARDS_LOAD_VIA_CDP -ErrorAction SilentlyContinue
  Pop-Location
}
exit $testExitCode
