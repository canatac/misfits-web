# misfits.ai Mail — Frontend

> IA-first email client — privacy-first, built for speed.
> Frontend pour le backend Rust SMTP/IMAP ([reimagined-guide](https://github.com/canatac/reimagined-guide)).

## Stack

- **Next.js 15** (App Router, RSC, standalone output)
- **TypeScript** strict
- **Tailwind CSS 4** + design tokens
- **Zustand** + TanStack Query (state)
- **Tiptap** (email composer)
- **shadcn/ui** + Radix (UI components)
- **Vitest** + Playwright (tests)
- **pnpm** (package manager)

## Quick start

```bash
# Install dependencies
pnpm install

# Dev server
pnpm dev

# Build
pnpm build

# Test
pnpm test
pnpm test:e2e
```

## Environment

```bash
# .env.local
BACKEND_URL=http://localhost:8080  # Rust API Warp
```

## Docker

```bash
# Build + run
docker compose -f docker-compose.web.yml up --build

# Access
http://localhost:3000
```

## CI/CD

- **Pipeline:** lint → typecheck → test → build → Docker → Scaleway Container Registry
- **Registry:** `rg.fr-par.scw.cloud/smtp-rust-registry/misfits-web`
- **Deploy:** HermesWeb VM (Scaleway DEV1-S, Caddy reverse proxy sur `mail.misfits.ai`)

## Architecture

```
src/
├── app/              # App Router pages
│   ├── layout.tsx    # Root layout (providers)
│   ├── page.tsx      # Landing page
│   ├── login/        # Auth pages
│   └── inbox/        # Email inbox
├── components/        # React components
│   ├── ui/           # Design system (shadcn/ui)
│   ├── providers.tsx # Theme + Query + Toast providers
│   └── ...
├── hooks/            # Custom hooks
├── lib/              # Utilities (cn, api, sanitize)
├── stores/           # Zustand stores
├── styles/           # Global CSS + Tailwind
└── types/            # TypeScript types
```

## Connection au backend

Le frontend se connecte au backend Rust via l'API Warp :
- **SMTP/IMAP API:** `http://smtp-vm:8080/api` (proxy via Next.js rewrites)
- **Auth:** SMTP credentials (AUTH LOGIN/PLAIN)
- **Email storage:** MongoDB (backend) → API → Frontend

## Déploiement

1. Push sur `main` → GitHub Actions build + push Docker image
2. SSH sur HermesWeb VM → `docker compose -f docker-compose.web.yml pull && up -d`
3. Caddy reverse proxy → TLS sur `mail.misfits.ai`

## License

MIT © 2026 misfits.ai
