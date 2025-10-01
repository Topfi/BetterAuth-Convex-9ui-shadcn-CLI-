# Hominis

Hominis is an infinite canvas where you can generate your own applets, while everything stays in sync. The project is built for a local-first experience—the local user's interface never waits on the network—while remote clients receive smooth, interpolated playback.

## Core Tenets

- Local-first prime directive: render instantly locally and stream smooth motion remotely.
- React 19 + Vite + TypeScript everywhere, with the React Compiler enabled by default.
- Convex is the canonical data source; derive UI directly from `useQuery` without mirroring state.
- Shared contracts (schemas, helpers, types) live in `shared/` and stay in sync across client and server.
- Security, audit logging, and privacy flows evolve together; destructive operations are always observable and reversible.
- Accessibility and theming are first-class—respect ARIA attributes, never strip focus outlines, and route theme changes through the global provider.

## Architecture at a Glance

- **Client runtime**: React 19 compiled by Vite with Tailwind and vendor primitives under `src/components/ui` (read-only).
- **Realtime & storage**: Convex handles data, optimistic updates, background jobs, audit trails, and rate limiting.
- **Identity**: Better Auth (via the template I build) powers passphrase, magic link, verification code, and OAuth flows via shared Zod contracts.
- **Workspace canvas**: @xyflow/react renders applet graphs; applets share the common shell and live under `src/features/workspace/applets/<id>/` with colocated metadata.
- **Automation**: Convex Agents and Sandpack-based runners back generated applets in `src/features/applets_generated/` and `convex/applets_generated.ts`.
- **Shared abstractions**: Any cross-tier contract belongs in `shared/`; keep validation logic symmetric.

## Feature Highlights

- **Local-first workspace** with optimistic transforms, interpolation, and replay for remote viewers.
- **Composable applets** that reuse the shared node shell and register metadata for Workspace routing.
- **End-to-end identity** including passphrase strength checks, OAuth linking, and account lifecycle management.
- **Security & privacy guardrails** covering audit logs, rate limiting, and full workspace/account purgers.
- **Generated agents** that execute Convex logic and Sandpack snippets for automated workflow assistance.

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+
- Convex CLI (installed automatically via `npm install`)
- A Resend account (for email) or enable console previews

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` (or your preferred local dotenv file) and fill in the required secrets. Keep `.env.example` authoritative.
3. Run the guided setup if you need seeded configuration:
   ```bash
   npm run setup
   ```
4. Start the local stack (Vite + Convex dev servers):
   ```bash
   npm run dev
   ```
   The frontend is available at `http://localhost:5173` and the Convex dashboard at `http://localhost:9876`.

## Development Workflow

- `npm run dev` — run the client and Convex dev server in parallel.
- `npm run generate` — trigger a one-off Convex compile when schema changes (no `npx convex codegen`).
- `npm run logs` — tail Convex logs locally.
- `npm run check` — execute guardrails (consistency checks, type checks, linting, formatting, Vitest). `src/components/Workspace.tsx` is temporarily excluded until memory constraints are resolved.
- `npm run audit` — run the security and secret scanning suite before shipping.
- `npm run update-envs` — synchronize environment variables across deployment targets.

## Testing

- Co-locate tests next to the implementation (`*.spec.ts[x]`); Convex tests should import the handler via `.handler`.
- `npm run check` runs the full suite. Add targeted `vitest` runs during development when iterating quickly.
- Workspace Vitest coverage is temporarily disabled—do not recreate `Workspace.spec.tsx` until the memory issue noted in `AGENTS.md` is resolved.

## Environment Variables

- `.env.example` is authoritative and documents every variable with comments and sample values.
- Update `.env.example` and relevant setup scripts in the same pull request whenever you add or rename configuration.
- Use `npm run update-envs` to refresh remote environments without clobbering production secrets.

## Documentation & References

- Convex — https://www.convex.dev/llms.txt
- Better Auth — https://www.better-auth.com/llms.txt
- @xyflow/react — https://reactflow.dev/learn
- 9ui / Base UI primitives — https://www.9ui.dev/llms.txt

## License

Hominis is distributed under the EUPL 1.2. See `LICENSE.md` for details.
