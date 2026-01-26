# Design System

**Reference:** Pestle ([pestlechef.app](https://www.pestlechef.app/))
**Style:** Warm/clean hybrid — balanced imagery
**Established:** 2025-01-25 (Issue #23)

---

## Core Principles

1. **Warmth** — Colors, typography, and motion should feel inviting, not clinical
2. **Clarity** — Information hierarchy is paramount; don't sacrifice usability for aesthetics
3. **Delight** — Small moments of joy (animations, celebrations) differentiate us
4. **Accessibility** — Light/dark modes, focus states, responsive design are requirements
5. **No shortcuts** — No emojis, no generic components; everything is intentional

---

## Hard Rules

- **NO EMOJIS** — Banned entirely. Use line icons, illustrated icons, or photography instead.
- **Light + Dark modes** — Both required, not dark-only
- **Animation is essential** — Not optional polish; micro-interactions, transitions, and celebrations are core to UX

---

## Theme System

Users can select:
- **Mode**: Light or Dark
- **Season**: Spring, Summer, Fall, Winter (affects accent colors and subtle tints)

See color palette prototype: `.claude/plans/2025-01-25-ui-overhaul/prototype-08-color-palette.html`

---

## Color Palette

### Core Colors

```css
:root {
  /* Backgrounds */
  --bg-primary: #1a1a1a;      /* Page background */
  --bg-secondary: #242424;    /* Sidebar, panels */
  --bg-card: #2a2a2a;         /* Cards, inputs */
  --bg-hover: #333333;        /* Hover states */

  /* Text */
  --text-primary: #f5f5f5;    /* Headings, primary content */
  --text-secondary: #a0a0a0;  /* Body text, descriptions */
  --text-muted: #6b6b6b;      /* Labels, metadata */
  --text-placeholder: #555555;/* Input placeholders */

  /* Accent */
  --accent: #e07850;          /* Primary actions, highlights */
  --accent-hover: #c96842;    /* Accent hover state */
  --accent-subtle: rgba(224, 120, 80, 0.15); /* Accent backgrounds */

  /* Borders */
  --border: #3a3a3a;          /* Default borders */
  --border-focus: #555555;    /* Focused input borders */

  /* Semantic */
  --success: #4ade80;         /* Completed, positive */
  --success-subtle: rgba(74, 222, 128, 0.15);
  --warning: #fbbf24;         /* Attention needed */
  --warning-subtle: rgba(251, 191, 36, 0.15);
}
```

### Usage Guidelines

| Element | Background | Text | Border |
|---------|-----------|------|--------|
| Page | `--bg-primary` | — | — |
| Sidebar | `--bg-secondary` | `--text-secondary` | `--border` (right) |
| Cards | `--bg-card` | `--text-primary` | `--border` |
| Primary buttons | `--accent` | white | — |
| Secondary buttons | `--bg-card` | `--text-primary` | `--border` |
| Inputs | `--bg-card` | `--text-primary` | `--border` |
| Muted labels | — | `--text-muted` | — |

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | 26px | 600 | `--text-primary` |
| Section title | 16-18px | 600 | `--text-primary` |
| Card title | 15-17px | 600 | `--text-primary` |
| Body text | 14-15px | 400 | `--text-secondary` |
| Small/meta | 12-13px | 400 | `--text-muted` |
| Tiny labels | 10-11px | 500 | `--text-muted` (uppercase) |

### Line Height

- Headings: 1.2-1.3
- Body: 1.5-1.6
- Compact (cards, lists): 1.3-1.4

---

## Spacing

### Base Unit

8px grid system.

### Common Values

| Use Case | Value |
|----------|-------|
| Page padding | 32px (desktop), 16px (mobile) |
| Card padding | 16-20px |
| Section gap | 24-32px |
| Card gap | 12-16px |
| Element gap (within cards) | 8-12px |
| Inline spacing | 4-8px |

---

## Border Radius

| Element | Radius |
|---------|--------|
| Large cards | 14-16px |
| Small cards | 10-12px |
| Buttons | 8-10px |
| Inputs | 10-14px |
| Tags/badges | 4-6px |
| Pills (suggestion chips) | 18-20px |
| Circles (avatars, steps) | 50% |

---

## Components

### Buttons

```css
/* Primary */
.btn-primary {
  background: var(--accent);
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
}
.btn-primary:hover {
  background: var(--accent-hover);
}

/* Secondary */
.btn-secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  background: var(--bg-hover);
}
```

### Cards

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.15s ease;
}
.card:hover {
  border-color: var(--text-muted);
}
```

### Inputs

```css
.input {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
}
.input::placeholder {
  color: var(--text-placeholder);
}
.input:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-subtle);
}
```

### Tags/Badges

```css
.tag {
  background: var(--bg-hover);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.badge {
  background: var(--accent);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}
```

---

## Navigation

### Desktop (Sidebar)

- Width: 220px
- Background: `--bg-secondary`
- Border: 1px right `--border`
- Logo at top, settings/profile at bottom
- Nav items: 12px padding, 8px border-radius
- Active state: `--bg-card` background

### Mobile (Bottom Tabs)

- 4 tabs: Home, Cookbook, Plan, Shop
- Profile/settings: Badge in top-right header
- Tab bar: `--bg-secondary`, border-top
- Active tab: `--accent` color
- Icons: 22px, labels: 10px

---

## Interaction Patterns

### AI Chat Input

- Prominent placement on home screen
- Placeholder: "What do you want to do?"
- Suggestion chips below (horizontally scrollable on mobile)
- **Behavior**: Action-based redirect (interprets intent, navigates to appropriate screen with context)

### Cooking Mode

- Distinct full-screen experience
- One instruction at a time, large text
- Integrated timers
- Minimal chrome, focused on the current step

### Reflection Prompts

- Non-blocking: Subtle toast/banner after cooking
- User can ignore or tap to add notes
- Notes persist on recipe page

### Smart Defaults (Home Screen)

Surface what's contextually relevant:
1. If meal ready to cook → show tonight's meal card
2. If shopping list pending → surface shopping CTA
3. If week unplanned → prompt to plan

---

## Prototypes

Reference prototypes in `.claude/plans/2025-01-25-ui-overhaul/`:

| Screen | File |
|--------|------|
| Home (desktop, AI-first) | `prototype-02-home-ai-first.html` |
| Home (mobile) | `prototype-03-home-mobile.html` |
| Recipe view | `prototype-04-recipe.html` |
| Cookbook | `prototype-05-cookbook.html` |
| Meal Plan | `prototype-06-meal-plan.html` |
| Shopping | `prototype-07-shopping.html` |

---

## Not Yet Designed

- Cooking Mode (full-screen step-by-step)
- Recipe Create/Edit
- Settings/Preferences
- Onboarding
- Empty States
