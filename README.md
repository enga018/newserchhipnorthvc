# 🏘️ Property Tax Collector

A mobile-friendly web app for door-to-door property tax data collection.

## Features
- ✅ Offline-first (works without internet)
- ✅ GPS location tracking
- ✅ Photo capture
- ✅ Property details collection
- ✅ Household / family survey — families per property, members (name, gender, age, relation), with auto population & children counts
- ✅ Property-scoped family IDs (NSN-0001/1, NSN-0001/2, …) in forms, record view, and CSV export
- ✅ CSV export with UTF-8 BOM, formula-injection protection, and CRLF line endings
- ✅ Correction workflow: admin flags → worker fixes → admin verifies, with full audit history
- ✅ Follow Up badge shows pending correction count in bottom navigation
- ✅ Guided step-by-step collection form with a review screen
- ✅ Modern, government-clean interface with bottom navigation
- ✅ Works on any smartphone

## How to Use

1. Open this link in your mobile browser
2. Step through the guided form: Property → Location & Photo → Occupant → Households → Review
3. Capture location and photo when prompted
4. Review and save the record
5. Move to next property

All data is saved on your phone automatically.

## For Admins

Export all collected data as CSV from the Summary tab.

## Development

After cloning the repository, install git hooks for automatic version bumping:

```bash
./hooks/install-hooks.sh
```

This sets up a post-commit hook that automatically bumps the version in `app/index.html` based on commit scope (see `CLAUDE.md` for versioning policy).

## Android app (APK)

The app is also packaged as an Android APK via [Capacitor](https://capacitorjs.com/), bundling the same `app/index.html` + `vendor/` assets locally so it works fully offline from first launch (no dependency on reaching Firebase Hosting).

- Every push to `main` builds a debug APK via `.github/workflows/android-apk.yml` and publishes it to a rolling [**"latest" GitHub Release**](https://github.com/enga018/newserchhipnorthvc/releases/tag/android-latest) — that's the stable link to share for install. It's also uploaded as the run's Artifacts if you want a specific commit's build.
- To sign a release build too, add repo secrets `ANDROID_KEYSTORE_BASE64` (base64-encoded `.keystore`/`.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD`.
- To build locally: `npm install`, then `npm run android:sync` (rebuilds `www/` from `app/index.html` and syncs it into `android/`), then `cd android && ./gradlew assembleDebug`.
- `www/` is a generated build artifact (gitignored) — never edit it directly; edit `app/index.html` and re-run the sync.

---

**Created for Village Council Property Tax Collection**
