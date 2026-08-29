[CmdletBinding()]
param(
  [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()
[Console]::InputEncoding = [Text.UTF8Encoding]::new()

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $repositoryRoot "dist"
}
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
$repositoryPrefix = $repositoryRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $outputRoot.StartsWith($repositoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "OutputDirectory must remain inside the Better UI Imropvement repository."
}

$manifestPath = Join-Path $repositoryRoot "manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$sourcePath = [IO.Path]::GetFullPath((Join-Path $repositoryRoot $manifest.main))
if (-not $sourcePath.StartsWith($repositoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Manifest main escapes the repository."
}
$source = Get-Content -LiteralPath $sourcePath -Raw
$sourceVersion = [regex]::Match($source, 'const VERSION = "([^"]+)"').Groups[1].Value
if ($sourceVersion -ne [string]$manifest.version) {
  throw "Manifest version $($manifest.version) does not match source version $sourceVersion."
}

New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$staging = Join-Path $outputRoot (".package-{0}" -f $PID)
$stagingPath = [IO.Path]::GetFullPath($staging)
$outputPrefix = $outputRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $stagingPath.StartsWith($outputPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Staging path escapes OutputDirectory."
}

$archivePath = Join-Path $outputRoot ("better-ui-imropvement-{0}.zip" -f $manifest.version)
$checksumPath = "$archivePath.sha256"
try {
  New-Item -ItemType Directory -Path (Join-Path $staging "scripts") -Force | Out-Null
  Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $staging "manifest.json")
  Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $staging "scripts\better-ui-imropvement.js")
  foreach ($name in @("README.md", "README.zh-CN.md", "NOTICE.md", "LICENSE")) {
    Copy-Item -LiteralPath (Join-Path $repositoryRoot $name) -Destination (Join-Path $staging $name)
  }
  Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath $staging | ForEach-Object FullName) -DestinationPath $archivePath -CompressionLevel Optimal -Force
  $archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $checksumLine = "{0}  {1}`n" -f $archiveHash, [IO.Path]::GetFileName($archivePath)
  [IO.File]::WriteAllText($checksumPath, $checksumLine, [Text.UTF8Encoding]::new($false))
  Write-Output $archivePath
  Write-Output $checksumPath
}
finally {
  if (Test-Path -LiteralPath $stagingPath) {
    Remove-Item -LiteralPath $stagingPath -Recurse -Force
  }
}
