# Contributing to JSONZero

Thank you for your interest in contributing to JSONZero!

JSONZero is a privacy-first, client-side developer workbench. Our guiding philosophy is **JSON. Zero clutter.** — zero tracking, zero accounts, zero unnecessary backend, and 100% local in-browser processing.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) version 20 or higher
- `npm` version 10 or higher
- Git

### Setup

```bash
git clone https://github.com/desobuild/jsonzero.git
cd jsonzero
npm install
npm run dev
```

The development server runs at `http://localhost:5173`.

---

## Development Commands

All commands use standard npm scripts:

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start Vite local development server                 |
| `npm run build`        | Typecheck and build production bundle into `dist/`  |
| `npm run preview`      | Preview production build locally at port 4173       |
| `npm run lint`         | Run ESLint checks                                   |
| `npm run format`       | Automatically format all files with Prettier        |
| `npm run format:check` | Verify formatting without modifying files           |
| `npm run typecheck`    | Run TypeScript compiler in check mode (`--noEmit`)  |
| `npm run test`         | Run Vitest unit & component test suite              |
| `npm run test:watch`   | Run Vitest in interactive watch mode                |
| `npm run test:e2e`     | Run full Playwright E2E test suite in Chromium      |

---

## Git Workflow & Branch Naming

1. Fork the repository on GitHub.
2. Create a topic branch from `main` using descriptive naming:
   - `feature/<short-name>` — New capabilities or enhancements
   - `fix/<short-name>` — Bug fixes
   - `docs/<short-name>` — Documentation updates
   - `perf/<short-name>` — Performance optimizations
   - `refactor/<short-name>` — Code cleanup without behavior changes
3. Keep commits atomic, well-described, and adhering to conventional commit guidelines (`feat:`, `fix:`, `docs:`, `chore:`, `perf:`).

---

## Core Development Principles

1. **Local Processing First & Always**: All JSON parsing, formatting, transformations, and diffing must execute entirely within the user's browser runtime.
2. **Zero External Network Calls**: Core features must never issue fetch requests, beacon calls, or load remote assets at runtime. All fonts and icons are self-hosted.
3. **Pure JSON Processing Utilities**: Keep business and transformation logic in pure, dependency-free utility functions in `src/shared/`. Separate UI components in `src/features/` from domain logic.
4. **Deterministic Behavior**: Given the same input, transformations, generators, and diff engines must produce consistent, reproducible output.
5. **No Telemetry or Analytics**: Do not add analytics SDKs, trackers, error telemetry services, or behavioral logging.
6. **No Silent JSON Persistence**: User JSON is ephemeral. Do not save user JSON to `localStorage`, `sessionStorage`, or `indexedDB`.
7. **Small Dependency Footprint**: Avoid pulling in heavy external libraries for simple tasks. Prefer standard browser APIs and native JavaScript/TypeScript algorithms.
8. **Accessibility by Default**: Ensure all interactive elements have ARIA semantics, keyboard navigation support (`Enter`/`Space`), visible focus indicators, and support for `prefers-reduced-motion`.

---

## Privacy & Security Contribution Rules

To protect our users and preserve trust, pull requests that violate any of the following rules will be rejected:

- :x: **Do not** upload, stream, or transmit user JSON to any server, proxy, or remote endpoint.
- :x: **Do not** integrate third-party trackers, analytics, advertising scripts, or telemetry beacons.
- :x: **Do not** load external CDNs or remote dependencies at runtime.
- :x: **Do not** evaluate JSON strings using `eval()` or dynamically construct executable code from user data.
- :x: **Do not** cache user data in Service Worker caches (Cache Storage is reserved strictly for immutable application assets).

---

## Quality & Testing Guidelines

Before opening a pull request, verify that every check passes locally:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

- **Unit Tests**: Add tests in `tests/unit/` for any new utility function, parser, or transformer.
- **Component Tests**: Add React Testing Library tests for UI interactions and state toggles.
- **E2E Tests**: Add or update Playwright tests in `tests/e2e/` for end-to-end user workflows.
- Never weaken, disable, or delete existing tests to make a PR pass.

---

## Pull Request Submission

When opening a PR:
1. Provide a concise title and clear summary using our [PR Template](.github/PULL_REQUEST_TEMPLATE.md).
2. Explain **what** changed and **why** the change is necessary.
3. Confirm that all local checks (`npm run format:check`, `lint`, `typecheck`, `test`, `test:e2e`, `build`) pass.
4. If UI modifications were made, attach before/after screenshots or screen captures. (Skip screenshots if no UI was changed).
5. Highlight any performance or privacy considerations.
