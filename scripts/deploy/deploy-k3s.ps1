param(
  [Parameter(Mandatory = $true)][string]$SshKeyPath,
  [Parameter(Mandatory = $true)][string]$SshHost,
  [Parameter(Mandatory = $true)][string]$SudoPassword,
  [Parameter(Mandatory = $false)][string]$ImageTag = "",
  [Parameter(Mandatory = $false)][string]$Namespace = "rp-prod",
  [Parameter(Mandatory = $false)][string]$EnvFilePath = "deploy/.env"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ImageTag)) {
  $ImageTag = Get-Date -Format "yyyyMMddHHmm"
}

$apiImage = "docker.io/library/rp-api:$ImageTag"
$webImage = "docker.io/library/rp-web:$ImageTag"

Write-Host "Rendering rp-secrets from env file..."
& powershell -ExecutionPolicy Bypass -File "scripts/deploy/render-secrets-from-env.ps1" -EnvFilePath $EnvFilePath -TemplatePath "deploy/k8s/02-secrets.template.yaml" -OutputPath "deploy/k8s/02-secrets.rendered.yaml"

Write-Host "Preparing manifests with local image tags..."
$tempDir = Join-Path $env:TEMP ("rp-k8s-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null
Copy-Item -Recurse deploy/k8s $tempDir

$files = Get-ChildItem -Path "$tempDir/k8s" -Filter "*.yaml" -File
foreach ($file in $files) {
  (Get-Content $file.FullName -Raw).
    Replace("docker.io/library/rp-api:latest", $apiImage).
    Replace("docker.io/library/rp-web:latest", $webImage) |
    Set-Content $file.FullName -Encoding UTF8
}

$srcTar = Join-Path $env:TEMP ("rp-src-" + $ImageTag + ".tar")
if (Test-Path $srcTar) { Remove-Item $srcTar -Force }

Write-Host "Creating source tar from current git HEAD..."
git archive --format=tar HEAD -o $srcTar

Write-Host "Copying source + manifests to server..."
ssh -i $SshKeyPath $SshHost "mkdir -p ~/rp-deploy-local/src ~/rp-deploy-local/k8s"
scp -i $SshKeyPath $srcTar "$SshHost`:~/rp-deploy-local/src.tar"
scp -i $SshKeyPath -r "$tempDir/k8s" "$SshHost`:~/rp-deploy-local/"

$escapedPwd = $SudoPassword.Replace("'", "'\"'\"'")

$remoteScript = @"
set -e
mkdir -p /home/roika/rp-deploy-local/src
rm -rf /home/roika/rp-deploy-local/src/*
tar -xf /home/roika/rp-deploy-local/src.tar -C /home/roika/rp-deploy-local/src
cd /home/roika/rp-deploy-local/src

sudo nerdctl --namespace k8s.io build -f docker/api.Dockerfile -t rp-api:$ImageTag .
sudo nerdctl --namespace k8s.io build -f docker/web.Dockerfile -t rp-web:$ImageTag .
sudo nerdctl --namespace k8s.io tag rp-api:$ImageTag rp-api:latest
sudo nerdctl --namespace k8s.io tag rp-web:$ImageTag rp-web:latest

sudo nerdctl --namespace k8s.io save -o /home/roika/rp-deploy-local/rp-api-$ImageTag.tar rp-api:$ImageTag
sudo nerdctl --namespace k8s.io save -o /home/roika/rp-deploy-local/rp-web-$ImageTag.tar rp-web:$ImageTag
sudo nerdctl --namespace k8s.io save -o /home/roika/rp-deploy-local/rp-api-latest.tar rp-api:latest
sudo nerdctl --namespace k8s.io save -o /home/roika/rp-deploy-local/rp-web-latest.tar rp-web:latest
sudo k3s ctr images import /home/roika/rp-deploy-local/rp-api-$ImageTag.tar
sudo k3s ctr images import /home/roika/rp-deploy-local/rp-web-$ImageTag.tar
sudo k3s ctr images import /home/roika/rp-deploy-local/rp-api-latest.tar
sudo k3s ctr images import /home/roika/rp-deploy-local/rp-web-latest.tar

sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/00-namespace.yaml
sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/01-configmap.yaml
sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/02-secrets.rendered.yaml
sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/03-postgres.yaml
sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/04-minio.yaml

sudo k3s kubectl rollout status statefulset/postgres -n $Namespace --timeout=300s
sudo k3s kubectl rollout status deployment/minio -n $Namespace --timeout=300s

sudo k3s kubectl delete job rp-db-migrate -n $Namespace --ignore-not-found
sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/07-migration-job.yaml
sudo k3s kubectl wait --for=condition=complete job/rp-db-migrate -n $Namespace --timeout=300s

sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/05-api.yaml
sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/06-web.yaml
sudo k3s kubectl apply -f /home/roika/rp-deploy-local/k8s/08-ingress.yaml

sudo k3s kubectl rollout status deployment/api -n $Namespace --timeout=300s
sudo k3s kubectl rollout status deployment/web -n $Namespace --timeout=300s

sudo k3s kubectl get pods -n $Namespace
sudo k3s kubectl get ingress -n $Namespace
"@

$remoteScriptPath = Join-Path $tempDir "run-deploy.sh"
Set-Content -Path $remoteScriptPath -Value $remoteScript -Encoding UTF8
scp -i $SshKeyPath $remoteScriptPath "$SshHost`:~/rp-deploy-local/run-deploy.sh"

Write-Host "Running deploy on server (local build mode)..."
ssh -i $SshKeyPath $SshHost "printf '%s\n' '$escapedPwd' | sudo -S -p '' bash /home/roika/rp-deploy-local/run-deploy.sh"

Write-Host "Deployment finished."
Write-Host "Images: $apiImage | $webImage"
Write-Host "Validation commands:"
Write-Host "sudo k3s kubectl get pods -n $Namespace"
Write-Host "sudo k3s kubectl get ingress -n $Namespace"

