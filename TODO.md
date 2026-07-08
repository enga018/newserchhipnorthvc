# TODO — Property Tax Collector PWA

## Recently Done
- [x] Wizard nav (Back/Next/Clear) fixed at bottom of viewport
- [x] All dashboard sections wrapped in `nest-box` for consistent card styling
- [x] Headers thinned (10px 16px padding), profile + logout side-by-side horizontally
- [x] Logout button styled to match profile badge (`border-radius:6px`)
- [x] Root landing page replaced with live VC stats from Firestore
- [x] Version + "Made with ❤️ by Enga" shown on splash, auth, and footer
- [x] "NSN VC Field Survey" prefix removed from footer
- [x] GitHub Pages unpublished
- [x] Performance Dashboard (HTML + JS) fully removed — dead code eliminated

## High Priority
- [ ] Design new home page layout (replace current overview)
- [ ] Family ID auto-assignment on record creation
- [ ] 4-tab bottom nav restructure (reduce from current tabs)
- [ ] Consistent offline-first alerts / sync status indicator
- [ ] VC name hardcoding review (replace inline VC name with configurable value)
- [ ] Bump app version and deploy

## Medium Priority
- [ ] Review & clean up `onAuthStateChanged` — disable auto-logout logic for demo/test users
- [ ] Remove VC selection dropdown if only one VC per deployment
- [ ] Consolidate legacy/unused CSS and JS
- [ ] Improve error messages and validation feedback
- [ ] Audit Firestore security rules

## Low Priority / Future
- [ ] Multi-tenancy support (v2) — see `FUTURE_PLANS.md`
- [ ] Photo compression before upload
- [ ] Dark mode toggle
- [ ] Export data as CSV/Excel
- [ ] Unit tests for core logic
