The application uses a **hardcoded configuration strategy** embedded directly within the client-side source code (`index.html`). There are no external configuration files (such as `.env`, `config.json`, or `yaml`), nor is there a build-time configuration injection system.

### Key Configuration Areas
1. **Firebase Credentials**: The Firebase project settings (`apiKey`, `authDomain`, `projectId`, etc.) and the hardcoded Admin email (`ADMIN_EMAIL`) are defined as global constants in the main script block of `index.html`. This couples the application logic tightly to a specific backend environment.
2. **PWA Manifest**: Runtime metadata for the Progressive Web App (name, theme colors, icons, and display mode) is managed via `manifest.json`, which is linked in the HTML `<head>`.
3. **Service Worker Cache**: Offline caching behavior is configured in `sw.js` using a static `CACHE_NAME` and a hardcoded list of `urlsToCache`.
4. **Versioning**: The application version (`APP_VERSION`) is a constant defined in `index.html`, used for display purposes in the UI.

### Developer Conventions
- **Direct Editing**: To change environments (e.g., from staging to production) or update API keys, developers must manually edit the JavaScript constants in `index.html`.
- **No Secret Management**: Sensitive credentials like the Firebase API key are exposed in the client-side bundle, relying on Firebase's security rules rather than environment-level secrecy.
- **Static Caching**: The service worker does not use dynamic precaching strategies; any new assets added to the app require manual updates to the `urlsToCache` array in `sw.js`.