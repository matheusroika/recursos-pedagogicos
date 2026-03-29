# Plataforma de Recursos Pedagogicos

Monorepo com:
- `apps/web`: React + Remix SSR
- `apps/api`: Hono API
- `packages/db`: Drizzle ORM + PostgreSQL
- `packages/shared`: tipos e schemas Zod

## Requisitos
- Node 22+
- pnpm 10+
- Docker + Docker Compose

## Setup
1. `pnpm install`
2. `docker compose up -d postgres minio`
3. `pnpm db:migrate`
4. `pnpm db:seed`
5. `pnpm dev`

A aplicacao web abre em `http://localhost:3000`.
A API abre em `http://localhost:3001`.

## Credenciais seed
- Email: `matheus@instituto-criativo.org`
- Senha: `12345678`

## Fluxos implementados
- Login/sessao
- Dashboard
- Lista e busca de materiais
- Cadastro de material
- Detalhe de material
- Compartilhamento
- Categorias e tags
- Notificacoes
- Perfil

## Deploy em Kubernetes (k3s)
O projeto ja possui base de deploy para k3s com:
- manifests em `deploy/k8s`
- deploy remoto com build local na VPS em `scripts/deploy/deploy-k3s.ps1`

Guia completo: `docs/deploy-k3s.md`.
