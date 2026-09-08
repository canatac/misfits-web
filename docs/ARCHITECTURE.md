# Architecture — misfits.ai Mail

> Public architecture overview. This document intentionally omits infrastructure endpoints,
> IP addresses, hostnames, credentials, and internal deployment paths. It focuses on the
> logical stack, the multi-agent development pipeline, and the operating rules that keep the
> project shipping predictably.

## 1. Product overview

**misfits.ai Mail** is a privacy-oriented email platform: users own their inbox, their
identity, and the delivery chain end-to-end. The product exposes a modern webmail on top of
a native SMTP/IMAP server and a dedicated DKIM signing service, without depending on
third-party email relays.

Design pillars:

- **Ownership** — no external SMTP relay, native mail path, DKIM/SPF/DMARC controlled
  by the operator.
- **Auditability** — every user-visible feature is backed by an issue, a pull request,
  a CI run and a merge event. No untraceable changes reach production.
- **Continuous delivery** — small, single-purpose PRs land continuously; releases are
  a side-effect of merging, not a separate ceremony.
- **Autonomy** — a fleet of AI agents drives day-to-day maintenance, testing, and
  incremental improvements under strict governance.

---

## 2. Technical stack (logical view)

```
+-------------------------------------------------------------+
|                        Users (browser)                      |
+----------------------------+--------------------------------+
                             |
                             v
+-------------------------------------------------------------+
|  Frontend         Next.js (App Router, TypeScript, React)   |
|  (misfits-web)    Server actions, Edge-safe API proxy       |
+----------------------------+--------------------------------+
                             | HTTP (private VPC)
                             v
+-------------------------------------------------------------+
|  Backend API      Rust / Actix-web                          |
|  (reimagined-     Hexagonal architecture:                   |
|   guide)          - domain crate (pure logic, no I/O)       |
|                   - ports/traits inside domain              |
|                   - adapters (Mongo, SMTP, IMAP, HTTP)      |
+---+---------------------+-----------------+-----------------+
    |                     |                 |
    v                     v                 v
+---------+       +---------------+   +---------------+
| MongoDB |       | SMTP / IMAP   |   | DKIM signer   |
| (auth,  |       | native stack  |   | (studious-    |
|  data)  |       | (native impl) |   |  octo-rotary- |
+---------+       +---------------+   |  phone)       |
                                      +---------------+
```

Runtime characteristics:

- **Frontend** — Next.js is deployed as a serverless-friendly build; all upstream
  calls go through a private proxy layer, never directly exposing the backend.
- **Backend** — a single Rust binary composed of a pure `domain` crate and thin
  adapter layers. Ports/traits live inside `domain`; no external crate is imported
  by the domain layer.
- **Storage** — MongoDB, accessed only through adapter code.
- **Mail path** — SMTP submission (port 587) and delivery, IMAP retrieval, DKIM
  signing via a dedicated service. No third-party outbound relay.

---

## 3. Repositories

The product is delivered across three public repositories with a strict
responsibility separation:

| Repository                       | Role                              | Language / tooling            |
|----------------------------------|-----------------------------------|-------------------------------|
| `canatac/misfits-web`            | Web frontend                      | Next.js, TypeScript, pnpm     |
| `canatac/reimagined-guide`       | Backend API + mail server         | Rust, Actix-web, MongoDB      |
| `canatac/studious-octo-rotary-phone` | DKIM signing microservice     | Rust                          |

Cross-repo work (contracts, integration tests, shared types) is coordinated but
never merged in a single monolithic change.

---

## 4. Engineering principles

### 4.1 Hexagonal architecture (backend)

The Rust backend follows a hexagonal / ports-and-adapters layout:

- `crates/domain` — pure business logic, no I/O, no external dependencies.
- Ports (traits) are defined inside `domain`.
- Adapters (Mongo, HTTP, SMTP, IMAP, DKIM client) live outside and are wired at startup.
- Invariant: `domain_external_imports == 0`. Enforced in CI.

### 4.2 Quality gates (CI-enforced)

Every PR must satisfy:

- **LOC per file** ≤ 200 (progressive target from 300 → 250 → 200).
- **Cyclomatic complexity** ≤ 8 per function (`lizard`).
- **Lint warnings** = 0.
- **Domain coverage** ≥ 90% (`cargo-llvm-cov`).
- **Domain external imports** = 0.

Soft gates surface as CI warnings and are progressively hardened.

### 4.3 GitOps end-to-end

Change flow is uniform across repos:

1. Issue opened (bug, feature, chore, security).
2. Branch created: `fix/issue-<n>` or `feat/issue-<n>`.
3. Draft PR opened at first commit.
4. CI runs the full pipeline. **Local builds are prohibited** — all
   `cargo build/test/clippy` and `pnpm build/test` execution happens on GitHub
   Actions runners. This keeps developer machines (human or agent) uniform and
   removes "works on my machine" from the loop.
5. PR is reviewed and marked ready for review only when checks are green.
6. Merge triggers deploy via `repository_dispatch` to the deploy workflow.

### 4.4 No local builds policy

A deliberate rule of the project:

- No developer runs `cargo build`, `cargo test`, `pnpm build`, `pnpm test`, or
  equivalent on their machine as part of the delivery loop.
- Every verification is delegated to GitHub Actions on the PR.
- Rationale: reproducibility, parallelism, faster ticket-to-PR latency, and
  identical constraints for human and agent contributors.

---

## 5. The agent fleet

A multi-role AI agent fleet operates continuously on the codebase. Each agent
runs in its own isolated session and communicates with the others through a
structured message bus. The fleet is fully governed: no agent can push code
without an issue and a validated dispatch.

### 5.1 Roles

| Role                | Responsibility                                                              | Allowed to write code? |
|---------------------|-----------------------------------------------------------------------------|------------------------|
| **Root**            | Human operator. Sets policy, approves scope changes, resolves escalations.  | No (governance only)   |
| **Product Owner**   | Market watch, competitor analysis, product vision, test matrix authoring.   | No                     |
| **Scrum Master**    | Backlog prioritization, ticket routing, dispatch, follow-up, closure.       | No (orchestration only)|
| **Testeur**         | Continuous testing of the production surface, regression reporting.         | No (test cmds + issues)|
| **Dev-web**         | Frontend fixes and features (Next.js).                                      | Yes (draft PRs)        |
| **Dev-back**        | Backend fixes and features (Rust).                                          | Yes (draft PRs)        |
| **Dev-int**         | Cross-repo integration, contracts, wiring, integration tests.               | Yes (draft PRs)        |

### 5.2 Interaction model

```
                            Root (human)
                                |
                                v
                        Product Owner (vision, matrix)
                                |
                                v
                         Scrum Master
              +------------+---+---+------------+
              |            |       |            |
              v            v       v            v
          Dev-web      Dev-back  Dev-int    Testeur
              \            |       /            |
               \           |      /             |
                \          v     /              v
                 +----> GitHub  <----   Production surface
                        (issues,          (public web app)
                         PRs, CI)
```

Rules:

- **Root** never writes code; it defines strategy and unlocks scope.
- **Product Owner** never writes code; it produces backlog inputs and expected results.
- **Scrum Master** is *orchestration-only*: no commit, no patch, no push. It
  prioritizes, assigns, comments, and dispatches.
- **Testeur** never modifies application code; it runs black-box tests on the
  public surface and opens GitHub issues with reproducible evidence.
- **Dev agents** only act on tickets they have been formally dispatched. They
  open draft PRs and rely on CI to validate.

### 5.3 Ticket lifecycle

1. **Discovery** — Testeur or Product Owner opens an issue with reproducible
   inputs and expected result. Regressions detected by Testeur must include
   command, response, and URL touched.
2. **Prioritization** — Scrum Master pulls open issues from all three repos each
   cycle, scores them (P0 = bug/regression/security, P1 = feature, P2 = chore),
   and selects a top-3 for dispatch.
3. **Routing** — a hard mapping determines the target dev:
   - `reimagined-guide` → dev-back
   - `studious-octo-rotary-phone` → dev-back
   - `misfits-web` → dev-int if labels/title mention contract/integration/api,
     otherwise dev-web
4. **Dispatch** — the Scrum Master must produce three artefacts per ticket:
   assignee update, a `SCRUM_DISPATCH` comment on the issue, and a `TICKET_ASSIGN`
   message delivered to the target dev agent.
5. **Implementation** — the dev creates `fix/issue-<n>`, applies the minimal
   change, commits, pushes, and opens a **draft** PR. No local build occurs.
6. **CI verification** — the dev polls `gh pr checks` non-blockingly and reports
   the status back to the fleet.
7. **Review** — humans (or Root) mark the PR ready for review when CI is green
   and the change matches scope.
8. **Merge & deploy** — merging triggers the deploy workflow.

### 5.4 Continuous default missions

When no ticket is dispatched, each agent has a default loop:

- **Product Owner** — market watch, competitor deltas, vision review, test
  matrix maintenance.
- **Scrum Master** — permanent backlog review, follow-up on owners, status
  updates, closure of conforming tickets.
- **Testeur** — rotate through the feature domains (auth, inbox, compose,
  security, admin) and open issues on any regression.
- **Dev agents** — incremental refactors, unit test additions, API catalog
  maintenance, dependency hygiene.

All default work still respects the "no PR without an issue and Root approval"
rule.

### 5.5 Health and self-healing

The fleet is monitored by a background ticker that:

- Emits a one-line aggregated status update on every tick.
- Detects idle agents and re-injects their default mission after a threshold.
- Detects agents that reply without providing concrete proof (URL, commit,
  test result) and escalates automatically.
- Verifies that Scrum-announced dispatches actually reached the dev agents
  and re-nudges when the count does not match.

This produces a self-repairing pipeline: an agent that drifts is nudged, then
escalated, then explicitly asked to redo the missing action, without human
intervention.

---

## 6. Governance rules

Non-negotiable rules that apply to every contributor, human or agent:

1. **Issue-first GitOps** — no branch, no PR, no dispatch without a corresponding
   GitHub issue.
2. **Scope lock** — an agent cannot expand scope; scope changes require a Root
   approval token (`ROOT_GO`).
3. **Orchestration/execution separation** — the Scrum Master never writes code;
   dev agents never orchestrate.
4. **Verifiable proof** — every status update from an agent must reference a
   verifiable artefact: a command output, an issue URL, a commit SHA, or a PR URL.
5. **No fabricated results** — if a test cannot be executed, an issue tagged
   `test_blocked` is opened; results are never invented.
6. **No local builds** — CI is the single source of truth for build and test.
7. **No external SMTP relay** — the mail path stays under the project's control.
8. **Small PRs** — atomic, single-purpose changes; large refactors are split
   into batches with explicit checkpoints.

---

## 7. Security posture

- Authentication and session data live in MongoDB behind adapter code; the
  domain layer never touches storage directly.
- All outbound network calls (backend to DKIM signer, frontend to backend) go
  through a private path; the public web app is the only externally exposed
  surface.
- Secrets are provisioned by an out-of-band secret manager and injected at deploy time; they never
  appear in the repository, in agent transcripts, or in the ticker log.
- Every change reaching production has: an issue, a PR, at least one CI run
  with green checks, and a merge commit signed off by review.
- Regression discovery is a first-class agent responsibility (Testeur), not an
  after-the-fact activity.

---

## 8. What this document intentionally does not disclose

To keep the repository safe as a public artefact, the following is out of scope
of this document by design:

- No infrastructure endpoints, hostnames, IP addresses, or ports.
- No provider names for hosting, DNS, storage, or secrets management.
- No deployment paths, service unit names, or filesystem layout.
- No credentials, tokens, or personal identifiers.
- No details about the internal agent transport, session identifiers, or
  operator tooling.

Operational documentation lives elsewhere, in access-controlled locations.

---

## 9. Glossary

- **Root** — the human operator with final authority.
- **PO / Product Owner** — agent responsible for product vision and backlog inputs.
- **Scrum Master** — orchestration-only agent; prioritizes, routes, and follows up.
- **Testeur** — black-box testing agent operating on the public surface.
- **Dev-web / Dev-back / Dev-int** — implementation agents for frontend, backend,
  and integration respectively.
- **TICKET_ASSIGN** — dispatch message from Scrum Master to a dev agent, carrying
  issue URL, priority, scope, and branch hint.
- **STATUS_UPDATE** — one-line structured message emitted by every agent each
  cycle, carrying activity, proof, and blockers.
- **ROOT_GO** — explicit approval token granted by Root for actions that would
  otherwise fall outside default scope.

---

*This document evolves with the product. Contributions are welcome via pull
request, following the same GitOps rules that govern the codebase itself.*
