## Dependency Management Approach

This repository employs a **zero third-party dependency** strategy. The application is built as a self-contained Progressive Web App (PWA) with no external package dependencies declared in `package.json`.

### System Overview

**Package Manager**: npm (indicated by `package.json` structure)
**Dependency Strategy**: No third-party dependencies; relies exclusively on:
- Browser-native APIs (for PWA functionality, IndexedDB, Geolocation, Camera)
- Node.js built-in modules (for testing only)
- Single-file architecture (`index.html` contains all application logic inline)

### Key Findings

1. **Minimal `package.json` Configuration**
   - Only declares metadata (`name`, `version`, `description`)
   - Marked as `"private": true` to prevent accidental publication
   - Single script: `"test": "node --test"` using Node.js native test runner
   - **No `dependencies` or `devDependencies` sections** — zero external packages

2. **No Lockfile Present**
   - No `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` exists in the repository
   - This is consistent with having no dependencies to lock

3. **Test Dependencies Use Node.js Built-ins Only**
   - Tests import exclusively from `node:test`, `node:assert/strict`, `node:fs`, and `node:path`
   - These are Node.js core modules available without installation
   - Test file extracts logic blocks directly from `index.html` for isolated testing

4. **Single-File Application Architecture**
   - All application code resides in `index.html` (153KB)
   - Logic is embedded inline between `=== BEGIN testable logic ===` and `=== END testable logic ===` markers
   - Service worker (`sw.js`) handles offline caching
   - No build step, bundler, or module resolution required

### Architecture Decisions

- **Offline-first PWA**: Designed to work without network connectivity, making third-party CDN dependencies impractical
- **No build tooling**: Eliminates need for webpack, vite, babel, or similar toolchains
- **Direct browser execution**: Code runs natively in browsers without transpilation
- **Self-contained deployment**: Single HTML file plus `manifest.json` and `sw.js` can be served from any static host

### Developer Conventions

1. **Adding Dependencies**: Any new third-party library would require:
   - Declaration in `package.json` under `dependencies` or `devDependencies`
   - Committing the corresponding lockfile (`package-lock.json`)
   - Ensuring the library works offline (no CDN reliance)

2. **Testing**: Use only Node.js built-in test framework (`node --test`); do not introduce test frameworks like Jest or Mocha unless absolutely necessary

3. **Code Organization**: Keep logic extractable from `index.html` using the BEGIN/END marker pattern for testability

4. **Version Management**: Since there are no dependencies, version updates only involve application code changes tracked via git

### Implications

- **Pros**: Minimal attack surface, no supply-chain risks, trivial deployment, fast load times, fully offline-capable
- **Cons**: No access to rich ecosystem libraries; all functionality must be implemented manually or use browser APIs
- **Maintenance**: Zero dependency update burden; no `npm audit` or security patching needed for third-party packages