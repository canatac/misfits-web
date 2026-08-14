# INSTALL — misfits-web

Frontend Next.js 15 (App Router, standalone output) pour misfits.ai Mail. Proxy vers backend Rust `reimagined-guide` (`email-api:8000`). Déployé sur HermesWeb VM.

## Prérequis

Sources: `package.json`, `Dockerfile`.

- **Node.js** `>=22.0.0` (`package.json` → `engines.node`)
- **pnpm** `9.15.0` (`package.json` → `packageManager`; `Dockerfile` → `corepack prepare pnpm@9.15.0`)
- Docker (uniquement pour builds CI — pas requis pour dev local)

## Installation locale

```bash
pnpm install                # respecte pnpm-lock.yaml
```

## Développement

```bash
pnpm dev                    # next dev, port 3000
```

Scripts disponibles (`package.json` → `scripts`):

| Script          | Commande             | Usage                              |
| --------------- | -------------------- | ---------------------------------- |
| `dev`           | `next dev`           | Serveur de dev                     |
| `build`         | `next build`         | Build production (standalone)      |
| `start`         | `next start`         | Serve build local                  |
| `lint`          | `next lint`          | ESLint (config `.eslintrc.json`)   |
| `typecheck`     | `tsc --noEmit`       | Vérification types                 |
| `test`          | `vitest run`         | Tests unitaires (`vitest.config.ts`) |
| `test:e2e`      | `playwright test`    | E2E                                |
| `format`        | `prettier --write .` | Formatage                          |

## Variables d'environnement

Sources: `next.config.ts`, `docker-compose.web.yml`, `src/lib/api-client.ts`.

| Variable                                     | Portée      | Source                    | Rôle                                                                 |
| -------------------------------------------- | ----------- | ------------------------- | -------------------------------------------------------------------- |
| `BACKEND_URL`                                | build/serveur | `next.config.ts` (rewrites), `src/lib/api-client.ts` | URL du backend `email-api`. Défaut prod: `http://email-api:8000`. Défaut dev: `http://localhost:8000`. Compilé dans les rewrites au build Next. |
| `NODE_ENV`                                   | build/serveur | `next.config.ts`, `Dockerfile` | `production` en runtime image                                       |
| `NEXT_TELEMETRY_DISABLED`                    | build/serveur | `Dockerfile`, `docker-compose.web.yml` | `1`                                                                  |
| `PORT`                                       | serveur     | `Dockerfile`              | `3000` interne (mappé `3001:3000` par compose)                       |
| `HOSTNAME`                                   | serveur     | `Dockerfile`              | `0.0.0.0`                                                            |
| `MISFITS_WEB_BUILD_VERSION`                  | runtime     | `docker-compose.web.yml`, workflow deploy | Label build affiché côté serveur                                     |
| `REIMAGINED_GUIDE_BUILD_VERSION`             | runtime     | `docker-compose.web.yml`, workflow deploy | Label backend                                                        |
| `NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION`      | runtime/client | `docker-compose.web.yml` | Exposé client, affiché dans le footer / admin (short SHA `web`)      |
| `NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION` | runtime/client | `docker-compose.web.yml` | Exposé client, short SHA backend                                     |
| `OPENROUTER_API_KEY`                         | serveur     | `src/app/api/ai/route.ts` (référencé) | Proxy AI `/api/ai` — clé jamais exposée client                       |

Fichier `.env.example` non présent dans le repo à date (constat: `ls .env*` vide). Créer un `.env.local` pour dev:

```bash
BACKEND_URL=http://localhost:8000
```

## Build production (local, optionnel)

```bash
pnpm build                  # produit .next/standalone
node .next/standalone/server.js
```

## Déploiement CI/CD (réel)

Source: `.github/workflows/ci.yml`.

Pipeline `CI/CD` sur push `main`/`master` ou pull request:

1. **Job `quality`** (parallèle): `pnpm lint` + `pnpm typecheck` + `pnpm test`.
2. **Job `build-and-push`** (parallèle avec `quality`, uniquement `main`/`master`):
   - `docker/setup-buildx-action@v3`
   - Login registry Scaleway (`rg.fr-par.scw.cloud`) avec `SCW_SECRET_KEY`.
   - `docker/build-push-action@v6`: build image via `Dockerfile` multi-stage, push tags `${SCW_REGISTRY_ENDPOINT}/misfits-web:latest` + `:${github.sha}`, cache GHA.
3. **Job `deploy`** (`needs: build-and-push`):
   - Résout `MISFITS_WEB_BUILD_VERSION = misfits-web@<12-char sha>`.
   - Interroge l'API GitHub Actions du repo `canatac/reimagined-guide` pour récupérer le SHA backend courant → `REIMAGINED_GUIDE_BUILD_VERSION`.
   - SSH sur la VM (`appleboy/ssh-action@v1.2.0`), `cd ${VM_DEPLOY_DIR}`, `docker compose -f docker-compose.web.yml pull web` puis `up -d web` avec les env vars build labels, puis `docker image prune -f`.

Contrainte VM: **pas de build docker/pnpm sur la VM**. La VM ne fait que `docker pull` + `up -d`.

## Secrets GitHub attendus

Source: `.github/workflows/ci.yml`.

| Secret                    | Usage                                                  |
| ------------------------- | ------------------------------------------------------ |
| `SCW_SECRET_KEY`          | Auth registry Scaleway (push image)                    |
| `SCW_REGISTRY_ENDPOINT`   | Base registry (`rg.fr-par.scw.cloud/<namespace>`)      |
| `VM_HOST`                 | Host SSH HermesWeb VM (`51.15.249.8`)                  |
| `VM_USER`                 | User SSH                                               |
| `VM_SSH_KEY`              | Clé privée SSH                                         |
| `VM_DEPLOY_DIR`           | Dossier sur VM contenant `docker-compose.web.yml`      |

Le workflow interroge aussi `https://api.github.com/repos/canatac/reimagined-guide/actions/runs` avec `github.token` (permission `actions: read` implicite) pour le label de version backend.
