## Overview

This Progressive Web App uses a **simple, inline error-handling approach** built around JavaScript's native `try/catch` blocks combined with DOM-based alert rendering. There is no dedicated error-handling framework, custom error types, or centralized error middleware.

## System Approach

### Core Pattern: Try/Catch + Alert Display

All asynchronous operations (Firebase Auth, Firestore reads/writes) are wrapped in `try/catch` blocks. Errors are handled through two mechanisms:

1. **User-facing alerts**: Error messages are rendered into designated `<div>` elements using helper functions (`showAlert`, `showAuthAlert`, `showAddWorkerAlert`). These display styled alert boxes with CSS classes `.alert-error` and `.alert-success`.

2. **Console logging**: Non-critical errors (e.g., profile auto-heal failures, service worker registration) are logged via `console.error()` without interrupting the user flow.

### Error Message Translation

A `friendlyError(code)` function (line 1207) maps Firebase Auth error codes to human-readable messages:
- `'auth/user-not-found'` → "No account found with this email"
- `'auth/wrong-password'` → "Incorrect password"
- `'auth/email-already-in-use'` → "Email already registered"
- `'auth/weak-password'` → "Password too weak (min 6 chars)"
- `'auth/invalid-email'` → "Invalid email address"
- `'auth/too-many-requests'` → "Too many attempts. Try again later"
- `'auth/invalid-credential'` → "Invalid email or password"
- Default fallback: "Something went wrong. Try again."

### Input Validation

Validation errors are caught **before** async operations via early-return guards:
- Empty field checks: `if (!email || !pass) return showAuthAlert('Please fill all fields', 'error')`
- Format validation: Phone number regex `/^[0-9]{10}$/`, password length checks
- Range validation: Numeric bounds checking for sticker range assignments

These produce immediate feedback without triggering network calls.

## Key Files

| File | Role |
|------|------|
| `index.html` | Single-file application containing all logic, including error handlers, alert functions, and validation guards |
| `sw.js` | Service worker with basic `.catch()` on cache operations (logs only, no user-facing errors) |
| `test/logic.test.js` | Unit tests that verify pure logic functions; one test explicitly confirms graceful fallback behavior (`getExifOrientation` falls back to `1` without throwing on truncated/garbage input) |

## Architecture & Conventions

### Alert Helper Functions

Three context-specific alert renderers exist:
- `showAlert(msg, type)` — General-purpose; scrolls to top, auto-clears after 4–6 seconds depending on type
- `showAuthAlert(msg, type)` — Auth screen specific
- `showAddWorkerAlert(msg, type)` — Admin worker-management modal; auto-clears after 4 seconds

All use the same HTML template: `<div class="alert alert-{type}">{msg}</div>`

### Error Propagation Strategy

- **Silent failure**: Many catch blocks swallow errors by returning `null` or doing nothing (e.g., `getUserProfile` returns `null` on any exception)
- **Non-blocking**: Errors in background operations (profile auto-heal, settings load) log to console but don't block the UI
- **Blocking with feedback**: Critical user actions (login, registration, record submission) display errors inline and re-enable disabled buttons

### Graceful Degradation

The `getExifOrientation` function demonstrates defensive programming: it falls back to orientation value `1` (normal) when encountering non-JPEG data, missing EXIF segments, or truncated buffers—explicitly tested to never throw.

## Rules Developers Should Follow

1. **Always wrap Firebase calls in try/catch** — Never let Promise rejections propagate unhandled
2. **Use `friendlyError(e.code)` for Firebase Auth errors** — Translates technical error codes into user-friendly messages
3. **Validate inputs before async operations** — Use early-return guards to prevent unnecessary network calls
4. **Display errors via alert helpers** — Use `showAlert()`, `showAuthAlert()`, or `showAddWorkerAlert()` depending on context; do not use raw `alert()`
5. **Auto-clear success messages, keep errors visible longer** — Success alerts clear after 4s; errors/info/warnings after 6s
6. **Re-enable UI controls on error** — If a button is disabled during an async operation, re-enable it in the catch block
7. **Log non-critical errors silently** — Background operations that fail should use `console.error()` without disrupting the user
8. **Fall back gracefully** — When parsing external data (EXIF, GPS), provide sensible defaults rather than throwing
