# Deploy em k3s (Contabo) - Build Local

Este projeto usa deploy com build local na VPS (sem GHCR):
- `web` em `rp.roika.com.br`
- `api` em `rp-api.roika.com.br`
- `console MinIO` em `rp-minio.roika.com.br`
- PostgreSQL e MinIO no cluster via PVC
- TLS pelo Traefik (Let's Encrypt)

## Estrutura
- Manifests: `deploy/k8s`
- Exemplo de env seguro: `deploy/.env.example`
- Render de secrets: `scripts/deploy/render-secrets-from-env.ps1`
- Deploy remoto (build local): `scripts/deploy/deploy-k3s.ps1`

## 1. Pré-requisitos
- DNS A configurado:
  - `rp.roika.com.br` -> IP público da VPS
  - `rp-api.roika.com.br` -> IP público da VPS
  - `rp-minio.roika.com.br` -> IP público da VPS
- Portas `80` e `443` liberadas
- k3s ativo na VPS
- `nerdctl` instalado na VPS
- Alterações commitadas (o script envia `git HEAD` para build)
- PowerShell disponível na máquina local para executar o script

## 2. Arquivo de segredos local (não versionado)
Crie `deploy/.env` a partir de `deploy/.env.example`.

`deploy/.env` é ignorado pelo git (regra `**/.env`).

## 3. Deploy remoto (build local na VPS)

```powershell
./scripts/deploy/deploy-k3s.ps1 -SshKeyPath "C:/Users/Matheus/RoikaKey.pem" -SshHost "roika@100.110.241.7" -SudoPassword "SUA_SENHA_SUDO" -EnvFilePath "deploy/.env"
```

Opcional: definir tag da imagem:

```powershell
./scripts/deploy/deploy-k3s.ps1 -SshKeyPath "C:/Users/Matheus/RoikaKey.pem" -SshHost "roika@100.110.241.7" -SudoPassword "SUA_SENHA_SUDO" -EnvFilePath "deploy/.env" -ImageTag "202603291700"
```

## 4. Validação
Na VPS:

```bash
sudo k3s kubectl get pods -n rp-prod
sudo k3s kubectl get ingress -n rp-prod
sudo k3s kubectl get pvc -n rp-prod
```

Externamente:
- `https://rp-api.roika.com.br/health` -> `200`
- `https://rp.roika.com.br` -> abre app
- `https://rp-minio.roika.com.br` -> console MinIO

## 5. Rollback rápido
Re-execute o deploy com uma `-ImageTag` anterior que exista no host.

## Observações importantes
- `deploy/k8s/02-secrets.template.yaml` pode ser commitado com segurança.
- `deploy/k8s/02-secrets.rendered.yaml` contém segredo e não deve ser commitado.
- Seed (`pnpm db:seed`) não é executado em produção.

## 6. Seed (opcional)
Para inserir dados mock após o deploy:

```bash
sudo k3s kubectl delete job rp-db-seed -n rp-prod --ignore-not-found
sudo k3s kubectl apply -f deploy/k8s/09-seed-job.yaml
sudo k3s kubectl wait --for=condition=complete job/rp-db-seed -n rp-prod --timeout=300s
sudo k3s kubectl logs job/rp-db-seed -n rp-prod
```
