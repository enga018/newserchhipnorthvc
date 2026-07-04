# Versioning policy

The app version lives in `index.html` as `const APP_VERSION = "vMAJOR.MINOR.PATCH"` (also used as the service worker cache-busting query string). Bump it on every commit to `main`:

- **Small change** (bug fix, tweak, small addition — roughly a diff of a few dozen lines in one area): PATCH += 1.
  Example: 1.1.1 → 1.1.2
- **Large change** (new feature, significant behavior change, broad/multi-file diff): MINOR += 1, PATCH resets to 0.
  Example: 1.1.1 → 1.2.0
- Judge small vs. large from the actual diff size/scope for that push (`git diff --stat` against the previous version), not a fixed line-count rule.

**Caps**: MINOR and PATCH each cap at 20. On overflow, the overflowing number and everything to its right reset to **1** (not 0), and the number to the left increments (cascades if that also overflows):
- PATCH would exceed 20 (small change): PATCH → 1, MINOR += 1 (check MINOR overflow too).
- MINOR would exceed 20 (large change, or cascading from a PATCH overflow): MINOR → 1, PATCH → 1, MAJOR += 1.

Examples: 1.20.20 + small change → 2.1.1. 1.20.0 + large change → 2.1.1 (MINOR was already at the cap).
