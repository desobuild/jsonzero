# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-18

### Added
- Open-source community readiness documentation: `docs/architecture.md`, `docs/deployment.md`, `docs/privacy.md`, `docs/versioning.md`.
- Standard GitHub community health files: `CODE_OF_CONDUCT.md`, `SUPPORT.md`.
- Structured GitHub issue templates for bug reports (`bug_report.yml`) and feature requests (`feature_request.yml`) with strict privacy warnings.
- Pull request template (`PULL_REQUEST_TEMPLATE.md`) with comprehensive pre-merge checklist.
- GitHub Actions CI workflow extended with Playwright E2E testing on Chromium.
- Repository metadata, keywords, and repository URLs in `package.json`.

## [0.1.0]

### Added
- **Core Formatter MVP (Phase 1)**:
  - Format, minify, and validate JSON payloads.
  - Configurable indentation: 2 spaces, 4 spaces, tabs.
  - Syntax error line and character indicators with actionable error diagnostics.
  - Sample JSON generator and one-click clipboard copy.

- **Editor & Search (Phase 2)**:
  - Search and replace toolbar with match count, previous/next navigation.
  - Match case and whole word matching toggles.
  - Line numbers and optional soft word wrap.

- **JSON Inspection (Phase 3)**:
  - Interactive recursive Tree View for nested objects and arrays.
  - Node expansion controls: individual toggle, Expand All, Collapse All.
  - Node-level actions: copy key, copy value, copy JSONPath.
  - In-tree search filtering with ancestor auto-expansion and match highlighting.
  - JSONPath query evaluator supporting root `$`, dot and bracket property access, array indexing `[0]`, wildcards `[*]`, and filter expressions.
  - Structural metrics analyzer: root type, max depth, node counts, primitive counts, and key counts.

- **JSON Compare & Diff (Phase 4)**:
  - Pure client-side recursive structural diff engine.
  - Object key order invariance and array order sensitivity.
  - Detailed classification of added, removed, and changed nodes with type transitions.
  - Side-by-side split editors on desktop with responsive tabbed switching on mobile viewports.

- **JSON Transformation & Utilities (Phase 5)**:
  - Alphabetical key sorting: shallow and recursive sort (preserving array order).
  - Flatten and unflatten utilities with dot/bracket paths, delimiter escaping, and collision protection.
  - Escaped JSON string compaction and unescaping.
  - Safe non-destructive preview pane with explicit apply and reset controls.

- **JSON Conversion (Phase 6)**:
  - JSON to Table: Tabular representation of object arrays with union key columns, nested value summarization, and TSV/CSV export.
  - JSON to CSV: RFC 4180 compliant CSV generator with delimiter selection (comma, tab, semicolon) and quote escaping.
  - JSON to TypeScript: Deterministic interface generation, type inference, union types for mixed arrays, and optional markers.
  - JSON to Dart: Dependency-free Dart models with `fromJson` and `toJson` serialization methods.
  - JSON to JSON Schema: Draft 2020-12 schema generation with required properties, types, and array item unions.

- **Developer & Testing Tools (Phase 7)**:
  - Schema Validation: Local Draft 2020-12 compatible validator running 100% offline without remote network `$ref` dependencies.
  - API Assertions: Deterministic generator for TypeScript `expect(...)` statements.
  - Playwright Assertions: Playwright API response testing code generator.
  - Generic Test Assertions: Framework-agnostic JSONPath assertions.
  - Mock JSON Generator: Inferred schema data mocking with deterministic strategies.
  - Expected vs Actual Workflow: Response diffing against contracts with diff-to-assertions generation.

- **Large JSON Performance (Phase 8)**:
  - Route-level lazy loading and code splitting (`React.lazy` and `Suspense`), reducing initial bundle to ~419 kB.
  - Dedicated Web Worker offloading for CPU-intensive parsing and diffing on documents >= 100 KB.
  - Abortable worker tasks with graceful recovery and instance recycling.
  - High-performance editor mode bypassing full-DOM syntax highlighting for documents > 150 KB or > 2,500 lines.
  - Windowed pagination (50 items/page) for large tables and tree nodes to prevent DOM explosions.

- **Offline & PWA (Phase 9)**:
  - Web App Manifest (`manifest.webmanifest`) and responsive icons.
  - Service worker caching application assets with content-hashed cache keys (`jsonzero-static-v1-<hash>`).
  - Cache Storage contains static application code only; user JSON is never cached.
  - Full offline execution across formatting, inspection, transformation, conversion, and workers.

- **Quality, Accessibility & Privacy Audit (Phase 10)**:
  - Comprehensive ARIA semantics (`role="toolbar"`, `role="tablist"`, `aria-pressed`, `aria-live`).
  - Full keyboard accessibility with `Enter`/`Space` support and visible `:focus-visible` rings.
  - WCAG AAA/AA compliant contrast and support for `prefers-reduced-motion`.
  - Zero-network verification: 0 external requests, 0 telemetry, 0 tracking.
