## Styling Approach

This Progressive Web App uses **vanilla inline CSS** embedded directly in `index.html` — no external stylesheets, preprocessors (Sass/Less), CSS frameworks (Tailwind, Bootstrap), or component libraries. All ~210 lines of CSS reside in a single `<style>` block within the HTML document.

## Design Token System (CSS Custom Properties)

The foundation is a well-structured **CSS custom property (variable) system** defined in `:root`, providing semantic theming:

### Color Palette
- **Primary**: `--primary: #2c5282` (deep blue), with variants `--primary-dark`, `--primary-light`, `--primary-tint`
- **Semantic colors**: `--success: #22863a`, `--warning: #b76e00`, `--danger: #c0392b`, each with matching background tints (`--success-bg`, etc.)
- **Surface system**: `--bg: #f3f6fa` (page background), `--surface: #fff` (cards/panels), `--surface-2: #f8fafc`
- **Text hierarchy**: `--text: #16202e` (primary), `--text2: #5b6675` (secondary/muted)
- **Utility**: `--border: #e2e7ee`, `--focus: #0366d6`, `--orange: #e65100` (compulsory field highlight)

### Spacing & Shape Tokens
- **Border radius**: `--radius: 12px`, `--radius-lg: 16px` — consistently applied to cards, buttons, inputs, modals
- **Shadows**: `--shadow` (subtle elevation), `--shadow-md` (header/modal depth)

## Architecture & Conventions

### Component-Based Class Naming
Classes follow a **BEM-inspired flat naming convention** organized by UI section via CSS comments:
- `.auth-screen`, `.auth-box`, `.auth-tab` — authentication flow
- `.header`, `.bottomnav`, `.navbtn` — navigation chrome
- `.wizard-step`, `.wstep`, `.wdot` — multi-step form wizard
- `.record-card`, `.stat-card`, `.worker-card` — data display cards
- `.modal`, `.modal-content`, `.modal-close` — overlay dialogs
- `.badge-*`, `.alert-*` — status indicators

### Mobile-First Responsive Strategy
- **Fixed max-width container**: `.container { max-width: 620px }` centers content on larger screens
- **Bottom navigation bar**: Fixed at viewport bottom with `env(safe-area-inset-bottom)` for iOS notch support
- **Sticky headers**: `.header` and `.admin-header` use `position: sticky; top: 6px` for persistent context
- **Modal adaptation**: Bottom-sheet style on mobile (`align-items: flex-end`, rounded top corners only), centered dialog on desktop (`@media(min-width: 520px)`)
- **Grid fallbacks**: `.stats-grid` uses `grid-template-columns: 1fr 1fr` with media query adjustment at 480px

### Interaction Patterns
- **Touch-friendly targets**: Buttons enforce `min-height: 46px`, inputs `min-height: 46px` — meeting WCAG touch target guidelines
- **Focus states**: Universal `:focus` ring using `box-shadow: 0 0 0 3px rgba(3,102,214,0.12)` with `--focus` border color
- **Micro-interactions**: `transition: all 0.15s` on buttons, tabs, wizard steps; `transform: translateY(1px)` on `:active`
- **Scroll lock**: JavaScript-driven `body.modal-open` class prevents background scroll when modals are active

### Animation System
Keyframe animations for state transitions:
- `wizFade` — wizard step entrance (opacity + translateX)
- `modalFade`, `modalSlide`, `modalPop` — modal open/close with cubic-bezier easing
- `fadeIn`, `popIn` — save success overlay
- Progress bar fills use `transition: width 0.4s`

## Key Files

- **`index.html`** (lines 18–210): Single source of truth for all CSS — design tokens, component classes, responsive rules, animations
- **`manifest.json`**: PWA theme color (`#2c5282`) and background color (`#f3f6fa`) aligned with CSS variables

## Rules for Developers

1. **No external CSS files or frameworks** — all styling lives in the `<style>` block of `index.html`
2. **Use design tokens exclusively** — reference `var(--primary)`, `var(--radius)`, etc. instead of hardcoding values
3. **Maintain mobile-first constraints** — test at 320px–480px widths first; desktop is progressive enhancement
4. **Follow the section-comment structure** — group new CSS under existing comment headers (e.g., `/* FORMS */`, `/* MODAL */`)
5. **Preserve touch target sizes** — interactive elements must maintain ≥46px height
6. **Match manifest colors** — any theme color changes must be reflected in both `:root` variables and `manifest.json`
7. **Avoid !important** — only used for `.hidden` utility and photo overlay visibility toggle
8. **Emoji as iconography** — UI icons are emoji characters (🏘️, 📋, 👤) rather than icon fonts or SVG sprites