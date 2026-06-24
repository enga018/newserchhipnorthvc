# Future Plans / v2 Notes

This file records ideas discussed but deliberately **not yet built**, so they aren't lost.

---

## v2 — Multi-Tenancy + Role Tiers (multiple Village Councils on one app)

### The goal
Let other Village Councils use this same app after New Serchhip North, with each VC's data fully separated — no mixing between councils.

### Role tiers
- **Super Admin** (the original owner) — can create VCs, assign each VC its own Admin, oversee everything across all VCs.
- **Admin** (one per VC) — manages only their own VC's workers and data.
- **Worker** — belongs to one VC, collects data for that VC only.
- Promotion = changing a user's role (worker → admin) within their VC.

### How it would work technically
- Every record, worker, and setting carries a **VC tag** (e.g. `vcId: "nsn"`).
- The app filters all data by `vcId` so each VC only sees its own.
- Firestore security rules must enforce: a user can only read/write data for their own VC.
- Super Admin role can see across all VCs.

### Why NOT built yet (honest reasons)
1. **Prove v1 first** — finish NSN's real-world collection; field use will reveal things that should shape v2.
2. **Build on real demand** — only when a specific second VC actually commits, not hypothetically.
3. **It's a data-layer rebuild, not a patch** — designing VC-separation in from the start of v2 is far safer than retrofitting it onto live data.

### Hard questions to settle BEFORE building v2
- **Data ownership/hosting:** Right now everything is in one personal Firebase project tied to `enga018@gmail.com`. Multiple councils' citizen data under one personal account is a governance/privacy concern. Each council may have rules about where their residents' data lives.
- **You become a service provider:** Supporting other councils = ongoing responsibility (their issues, uptime, account problems), especially for government data.
- **Free tier limits:** One small council fits Firebase's free tier easily. Several councils — especially with stamped photos stored in the database — will hit storage/bandwidth limits faster. Likely need to move photos to Firebase Storage or go paid.
- **Security complexity:** Rules get more complex; the cost of a mistake (one VC seeing another's data) is high.

### Good news
Nothing collected now is wasted. NSN's existing data can be tagged with a `vcId` and migrated cleanly into a v2 structure.

---

## Other noted-for-later items

### Tax exemption handling
- Current govt rule exempts nothing — all properties taxable.
- Council *may* introduce some local exemptions later (not yet decided).
- When rules are known, add a simple **"Tax Exempt" toggle + reason field**, or exemption logic based on Owner Type.
- No rush: every record already captures Property Type, Owner Type, Building Type — exemptions can be applied retroactively to already-collected data. Nothing needs re-collecting.

---

*Last updated: during initial build, before field rollout.*
