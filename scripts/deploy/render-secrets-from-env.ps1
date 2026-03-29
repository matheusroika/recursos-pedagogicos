param(
  [Parameter(Mandatory = $false)][string]$EnvFilePath = "deploy/.env",
  [Parameter(Mandatory = $false)][string]$TemplatePath = "deploy/k8s/02-secrets.template.yaml",
  [Parameter(Mandatory = $false)][string]$OutputPath = "deploy/k8s/02-secrets.rendered.yaml"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFilePath)) {
  throw "Env file not found: $EnvFilePath"
}

if (-not (Test-Path $TemplatePath)) {
  throw "Template file not found: $TemplatePath"
}

$envMap = @{}
Get-Content $EnvFilePath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }

  $parts = $line -split "=", 2
  if ($parts.Count -ne 2) { return }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()

  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  if ($value.StartsWith("'") -and $value.EndsWith("'")) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  $envMap[$key] = $value
}

$requiredKeys = @(
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "POSTGRES_PASSWORD",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY"
)

foreach ($k in $requiredKeys) {
  if (-not $envMap.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($envMap[$k])) {
    throw "Missing required key in env file: $k"
  }
}

$content = Get-Content $TemplatePath -Raw
foreach ($entry in $envMap.GetEnumerator()) {
  $content = $content.Replace(('${' + $entry.Key + '}'), $entry.Value)
}

Set-Content $OutputPath -Value $content -Encoding UTF8
Write-Host "Rendered secrets file: $OutputPath"
