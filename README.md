# Plataforma de Recursos Pedagógicos

Monorepo da plataforma de compartilhamento de materiais pedagógicos.

## Estrutura do projeto
- `apps/web`: frontend React + Remix SSR
- `apps/api`: API em Hono
- `packages/db`: camada de banco com Drizzle ORM + PostgreSQL
- `packages/shared`: tipos e schemas Zod compartilhados

## Requisitos
- Node 22+
- pnpm 10+
- Docker + Docker Compose

## Primeira execução (ambiente novo)
1. Instale as dependências:
   - `pnpm install`
2. Suba os serviços locais:
   - `docker compose up -d postgres minio`
3. Aplique as migrations (cria/atualiza estrutura do banco):
   - `pnpm db:migrate`
4. Execute o seed (dados iniciais para desenvolvimento):
   - `pnpm db:seed`
5. Inicie a aplicação:
   - `pnpm dev`

Aplicação web: `http://localhost:3000`  
API: `http://localhost:3001`

## Execução no dia a dia
- Para iniciar o projeto normalmente: `pnpm dev`
- Só rode `pnpm db:migrate` quando:
  - for um banco novo, ou
  - houver novas migrations no projeto
- Só rode `pnpm db:seed` quando:
  - for a primeira inicialização de um banco novo, ou
  - você quiser restaurar os dados de exemplo no ambiente local

## O que o `db:seed` adiciona
O seed cria (sem duplicar a maior parte dos dados) uma base inicial para testes locais:
- 1 instituição: `Instituto Criativo`
- 4 usuários: `matheus`, `carla`, `bruno`, `fernanda`
- conta de login (`accounts`) para os usuários seed
- 5 categorias: Linguagem, Matemática, Desenvolvimento, Planejamento e Socioemocional
- 7 tags: inclusão, leitura, alfabetização, rotina, autonomia, adaptação e lógica
- 1 material publicado de exemplo: `Jogo de Letras`
- vínculo de tags no material
- 1 compartilhamento do material + 1 notificação

Observação importante:
- ao reexecutar o seed, ele atualiza a senha dos usuários seed para o valor padrão abaixo.

## Credenciais padrão do seed
- Email: `matheus@instituto-criativo.org`
- Senha: `12345678`

## Fluxos implementados
- Login/sessão
- Dashboard
- Lista e busca de materiais
- Cadastro de material
- Detalhe de material
- Compartilhamento
- Categorias e tags
- Notificações
- Perfil

## Deploy em Kubernetes (k3s)
O projeto já possui base de deploy para k3s com:
- manifests em `deploy/k8s`
- deploy remoto com build local na VPS em `scripts/deploy/deploy-k3s.ps1`

## Documentação
- Guia de deploy em k3s (passo a passo): [docs/deploy-k3s.md](docs/deploy-k3s.md)
