# JSONZero Versioning & Release Strategy

JSONZero follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

---

## 1. Current Lifecycle Stage

- **Current Version**: `0.1.0`
- **Pre-1.0 Milestone**: JSONZero is in active feature development leading up to its official v1.0.0 production release.
- Breaking changes or workbench restructuring during `0.x` will be incremented via **MINOR** versions (`0.2.0`, etc.).
- The official **v1.0.0** release will mark the completion of the Final UI/UX Polish phase and public release readiness.

---

## 2. Release Increments

### PATCH Releases (`x.y.Z`)
Incremented for backwards-compatible bug fixes, performance optimizations, accessibility adjustments, and documentation improvements.
- *Examples*: Fixing an edge case in JSONPath evaluation, fixing a CSV escaping bug, improving contrast of focus indicators.

### MINOR Releases (`x.Y.0`)
Incremented when adding new backwards-compatible functionality or tools.
- *Examples*: Adding a new export format, introducing a new JSON transformation mode, adding a new developer utility.

### MAJOR Releases (`X.0.0`)
Incremented for significant architectural overhauls, breaking changes to core workflows, or major redesigns.
- *Examples*: v1.0.0 initial production release; major UI paradigm redesigns.

---

## 3. Release Process

1. **Verify All Checks**:
   ```bash
   npm run format:check
   npm run lint
   npm run typecheck
   npm run test
   npm run test:e2e
   npm run build
   ```
2. **Update Version**:
   - Update `"version"` in `package.json`.
3. **Update Changelog**:
   - Move entries from `[Unreleased]` in `CHANGELOG.md` to a new `[x.y.z] - YYYY-MM-DD` section.
4. **Tag & Publish**:
   - Create a Git tag `vX.Y.Z` matching the release version.
   - Push commit and tag to `main`.
