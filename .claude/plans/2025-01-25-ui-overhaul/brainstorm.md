# UI/UX Overhaul Brainstorm

**Issue:** #23 — Visual/UX overhaul
**Date:** 2025-01-25
**Status:** Revision Required (see Lessons Learned)

---

## Problem / Motivation

Current UI is functional but lacks cohesive design. Need to establish design standards and apply them consistently across all screens. This is the gate for shipping v1.0 MVP.

The challenge: UI/UX work is inherently visual, making terminal-based brainstorming difficult. Solution: **Reference → Prototype → Refine** workflow.

---

## Method Established

1. **Reference Hunting** — Identify existing apps with appealing UI/UX
2. **Throwaway Prototypes** — Standalone HTML files to visualize and iterate
3. **Lock Design System** — Document colors, typography, spacing, patterns

---

## Reference Point

**Pestle** ([pestlechef.app](https://www.pestlechef.app/)) — chosen as primary reference for:
- Clean, ad-free layouts
- Balanced imagery (photos present but not dominant)
- Dark mode support
- Step-by-step guided cooking
- Modern, focused recipe cards

---

## Style Direction

| Attribute | Decision |
|-----------|----------|
| Overall feel | Warm/clean hybrid — Pestle's clarity with balanced imagery |
| Imagery | Balanced — photos present but not dominant |
| Density | Not utility-dense, not overly playful |
| Dark mode | Yes, as primary theme |
| Accent color | Coral/terracotta (#e07850) |

---

## Core Features (Pestle Parity)

- Guided cook mode (step-by-step, hands-free)
- Recipe import (URL, social media, scan)
- Meal planning (weekly calendar)
- Shopping lists

---

## Differentiators (Our Vision)

### 1. Reflect & Improve
- **Light prompt**: Subtle toast/banner after marking meal complete ("How did it go?")
- **Deeper review**: On-demand via recipe page notes section
- AI can suggest modifications based on accumulated feedback

### 2. Focused Weekly Flow
- Timeline view of the week
- Today's meal front and center, one tap to cook
- Smart defaults based on time of day
- Minimal decisions once plan is set — app handles transitions

### 3. Powerful Shopping
- Pantry check before list generation
- AI substitution suggestions (inline in shopping list)
- Smart quantity consolidation across recipes
- Per-store lists (Grocery, Costco, Butcher, etc.)
- Future: pricing + store-specific data

### 4. AI Throughout
- Visible and useful, not hidden
- Supports all three modes: manual, AI-assist, full automation
- Central chat input on home screen

---

## Navigation Structure

### Desktop
- **Sidebar** (left): Home, Cookbook, Meal Plan, Shopping
- **Settings**: Bottom of sidebar with profile badge/name

### Mobile
- **Bottom tab bar**: Home, Cookbook, Plan, Shop (4 tabs)
- **Profile/Settings**: Badge in top-right header

---

## Key UX Decisions

### Home Screen
- **Primary focus**: Smart contextual — surfaces what's relevant
  - If meal ready to cook → show that
  - If shopping list pending → surface that
  - If week unplanned → prompt to plan
- **AI chat input**: Central "What do you want to do?" with suggestion chips
- **AI response behavior**: Action-based redirect (interprets intent, navigates to appropriate screen with context)

### Cooking Mode
- **Distinct full-screen experience** — not just the recipe page
- Focused step-by-step UI
- One instruction at a time, large text
- Integrated timers
- Voice control (hands-free)

### Reflection
- **Non-blocking**: Subtle toast/banner after cooking
- User can ignore or tap to add notes
- Notes persist on recipe page for future reference

---

## Prototypes Created

All in `.claude/plans/2025-01-25-ui-overhaul/`:

| File | Description |
|------|-------------|
| `prototype-01-home.html` | Initial home with sidebar (v1) |
| `prototype-02-home-ai-first.html` | AI-first home with central chat input |
| `prototype-03-home-mobile.html` | Mobile home with bottom tabs |
| `prototype-04-recipe.html` | Recipe view with ingredients panel, instructions, notes |
| `prototype-05-cookbook.html` | Recipe library with collections, search, grid |
| `prototype-06-meal-plan.html` | Weekly calendar with AI suggestions, stats |
| `prototype-07-shopping.html` | Per-store lists, pantry check, AI substitutions |

---

## Screens Not Yet Prototyped

To be addressed in planning/implementation:

- **Cooking Mode** — Full-screen step-by-step cooking experience
- **Recipe Create/Edit** — Manual recipe entry and editing
- **Settings/Preferences** — Dietary restrictions, household size, AI mode preferences
- **Onboarding** — First-time user setup
- **Empty States** — New user with no recipes/plans

---

## Open Questions (Deferred)

These will be addressed during implementation:

- Pantry management UI location and data model
- Recipe import validation flow
- Offline mode scope
- Multi-device sync behavior
- Notification preferences

---

## Design System (Extracted from Prototypes)

### Colors
```css
--bg-primary: #1a1a1a;
--bg-secondary: #242424;
--bg-card: #2a2a2a;
--bg-hover: #333;
--text-primary: #f5f5f5;
--text-secondary: #a0a0a0;
--text-muted: #6b6b6b;
--accent: #e07850;
--accent-hover: #c96842;
--border: #3a3a3a;
--success: #4ade80;
--warning: #fbbf24;
```

### Typography
- Font: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- Page titles: 26px, weight 600
- Section titles: 16-18px, weight 600
- Body: 14-15px
- Small/meta: 12-13px

### Spacing
- Page padding: 32px
- Card padding: 16-20px
- Card border-radius: 10-16px
- Gap between cards: 12-16px

### Components
- Buttons: 8-10px border-radius, primary uses accent color
- Inputs: Dark background, subtle border, 10-14px border-radius
- Cards: Dark background (#2a2a2a), 1px border, subtle hover state
- Tags/badges: Small, rounded, muted background

---

## Independent Design Review

### Typography Critique

**Issue: System Font Stack Lacks Character**
The current stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`) is functional but generic. For a cooking app aiming to feel "warm," consider:

- **Display font**: A warmer sans-serif like **DM Sans**, **Plus Jakarta Sans**, or **Outfit** for headings
- **Body font**: Keep system fonts for body text (performance), but use display font for page titles and section headers
- **Font weight variety**: Currently only 400/500/600. Adding 300 (light) for large display text or 700 (bold) for emphasis would create better typographic rhythm.

### Color & Visual Warmth

**Issue: Dark Theme Feels Cold Despite "Warm" Intent**
The coral accent (#e07850) is warm, but the gray backgrounds (#1a1a1a, #242424, #2a2a2a) are pure neutral grays with no warmth.

**Recommendation — warm the grays:**
```css
--bg-primary: #1a1918;    /* Very subtle brown undertone */
--bg-secondary: #242321;
--bg-card: #2a2927;
```

**Issue: Accent Color Isolation**
The coral accent appears only on buttons and highlights. Could be woven more subtly throughout:
- Subtle warm gradient overlays on hero images
- Slight coral tint in hover states
- Warmer success green (current #4ade80 is very cool)

### Component-Specific Feedback

#### Home Page (AI-First)
- **"What do you want to do?"** placeholder is vague. More evocative: *"What are we cooking?"* or *"How can I help?"*
- **Two-column layout** visual weight is uneven. Quick Actions have icons+text+arrows; Week Preview is text-only. Consider small meal thumbnails in the week preview.
- **Greeting** could be more delightful — incorporate meal context ("Good evening — salmon night!")

#### Recipe Page
- **Hero image gradient** is basic. Consider more sophisticated treatment (blur, vignette, warm overlay blend).
- **Step numbers** could become progress indicators in cooking mode (filled circles as steps complete).
- **Timer buttons** look like generic tags. Make them more interactive-looking (clock icon animation on hover?).
- **Notes section** — Consider adding sentiment (green border for positive reflections, yellow for "needs work").

#### Cookbook
- **Recipe cards** — When there's no image, design an attractive fallback (gradient with dish name, category icon, etc.).
- **Sort dropdown** — Standard select element feels dated. Consider styled dropdown or segmented control.
- **Empty result state** — Not designed. Critical for new users.

#### Meal Plan
- **7-column calendar** will crush on narrow screens. Consider responsive behavior: stacked list on medium screens, horizontal scroll on small.
- **Empty meal slots** — "+ Add meal" could be more inviting. Subtle illustration or suggestion ("Try a one-pot meal?").
- **Today column** — Could pop more. Consider subtle glow or elevated shadow.

#### Shopping
- **Three-panel layout** may feel cramped. Left panel (store lists) could collapse to icons on narrower viewports.
- **Checked items** — Reducing to 0.5 opacity hides useful info. Consider moving checked items to collapsible "Done" section instead.

### UX Concerns

**AI Interaction:**
- What happens if AI doesn't understand the query? No error state designed.
- "Action-based redirect" could be jarring. Consider brief loading/interpretation state ("Finding dinner ideas...") before redirect.

**Navigation:**
- Sidebar collapses? Fixed 220px may waste space on large monitors or cramp small ones.
- Mobile: Profile top-right while nav is bottom bar splits attention. Consider profile in sidebar/settings or 5th tab.

**Accessibility:**
- Dark mode only? Users with visual impairments may need high contrast or light mode.
- Not all interactive elements show clear focus indicators.

**States & Feedback:**
- All transitions are 0.15s ease — identical. Vary timing for different interactions.
- No loading states designed (skeleton screens for recipe cards, spinners for AI processing).

### Enhancement Ideas

1. **Live timer on "Tonight's Meal" card**: If dinner planned for 6:30 PM, show countdown: "Dinner in 2h 15m"
2. **Seasonal theme variations**: Subtle color shifts by season (warmer fall tones, fresh spring greens)
3. **Celebration moments**: When meal marked complete, brief confetti burst or warm glow
4. **Ingredient illustrations**: Hand-drawn or line illustrations for premium feel

### Review Summary

| Area | Rating | Priority |
|------|--------|----------|
| Information Architecture | ★★★★☆ | — |
| Visual Hierarchy | ★★★★☆ | — |
| Typography | ★★★☆☆ | Medium |
| Color/Warmth | ★★★☆☆ | Medium |
| Component Design | ★★★★☆ | Low |
| Responsive Considerations | ★★☆☆☆ | High |
| Delight/Personality | ★★★☆☆ | Medium |
| Accessibility | ★★☆☆☆ | High |

---

## Lessons Learned (Post-Implementation Review)

The initial TDD execution produced an implementation that diverged significantly from the prototypes. This section documents what went wrong to prevent recurrence.

### Issues Found

1. **Navigation structure not updated**
   - Sidebar kept old structure (My Recipes, Libraries, Discover, Cook Mode) instead of prototype structure (Home, Cookbook, Meal Plan, Shopping)
   - No "Home" link in sidebar — users couldn't navigate to the home page
   - Logo linked to `/recipes` instead of `/home`

2. **Home page built but not integrated**
   - HomePage component exists with correct content
   - But navigation doesn't route users there
   - Layout differences from prototype (stacked vs 2-column quick actions)
   - Missing "View Recipe" button, difficulty indicator

3. **Recipe page ~60-70% complete**
   - Missing: Servings adjuster, ingredient checkboxes, "Add to Shopping List", fixed "Start Cooking" bar, "Add a note" functionality, favorite button

4. **Cookbook page ~50-60% complete**
   - Missing: Collections section, Import button, view toggle (grid/list), active filter pills, favorite hearts on cards, time badge on card images

5. **Theme/Season selector never placed**
   - Plan mentioned "temporary location: header" but never specified permanent location
   - Neither theme toggle nor season picker visible in the app

6. **No visual verification process**
   - Tests passed but didn't catch visual mismatches with prototypes
   - Acceptance criteria were incomplete relative to prototype details

### Root Causes

1. **Incomplete acceptance criteria** — Plan extracted some features from prototypes but not all. TDD executed against incomplete criteria and called it done.

2. **No visual verification step** — No process required implementer to compare against prototype HTML files.

3. **Ambiguous placement** — Theme selector had no clear permanent location specified.

### Process Improvements for Revision

1. **Prototypes are binding** — Each screen feature must include explicit instruction to open prototype HTML side-by-side during implementation.

2. **Exhaustive acceptance criteria** — Every visible element from prototype must be captured in acceptance criteria.

3. **Visual verification checkpoint** — After implementation, manually verify against prototype before marking complete.

---

## Decisions Made (Post-Review)

### Theme System
- **Light mode + Dark mode** — both required, not dark-only
- **Seasonal color themes**: Spring, Summer, Fall, Winter variations
- User can select preferred theme; system adapts accent colors and subtle background tints
- **Theme toggle location**: Settings page only
- **Season picker location**: Settings page only

### Visual Language
- **NO EMOJIS** — banned entirely from the application
- Icons and imagery will be designed/selected over time
- Use line icons, illustrated icons, or photography — never emoji

### Collections Icons (Cookbook Page)
Use Lucide icons for collection cards instead of emoji:
| Collection | Icon |
|------------|------|
| Favorites | `Heart` |
| Quick Meals | `Zap` |
| Healthy | `Salad` |
| Party Food | `PartyPopper` |
| New Collection | `Plus` |

### Animation, Movement & Gamification
- **Essential component** of the UX — not optional polish
- See prototype: `.claude/plans/2025-01-25-ui-overhaul/prototype-09-animations.html`

**Decisions Made:**

| Element | Animation Style |
|---------|-----------------|
| **Buttons** | Scale pop on hover + glow burst on click |
| **Cards** | Glow effect (accent border + shadow) on hover |
| **Loading content** | Skeleton shimmer |
| **AI thinking** | Spinner or bouncing dots |
| **Cooking progress** | Step progress (dots with line fill) |
| **Checkboxes** | Bounce check |
| **Toggles** | Smooth slide with overshoot |
| **Lists** | Staggered slide-in |
| **Celebrations** | Success burst + confetti for achievements |
| **Favorites** | Heart pop animation |
| **Add to list** | Bounce with state change |
| **Errors** | Input shake |
| **Modals** | Scale-in from center with overlay fade |
| **Drawers** | Slide from edge |

**Timing Guidelines:**
- Most interactions: 150-300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for responsive feel
- Celebrations: Allow overshoot/bounce
- Stagger delays: 60-100ms between items

---

## Updated Design Principles

1. **Warmth** — Colors, typography, and motion should feel inviting, not clinical
2. **Clarity** — Information hierarchy is paramount; don't sacrifice usability for aesthetics
3. **Delight** — Small moments of joy (animations, celebrations) differentiate us
4. **Accessibility** — Light/dark modes, focus states, responsive design are requirements
5. **No shortcuts** — No emojis, no generic components; everything is intentional

---

## Next Steps

1. Run `/plan` to structure implementation approach
2. Decide phasing: which screens to build first
3. Create **Cooking Mode** prototype before implementation
4. Create **Animation/Gamification exploration** prototype
5. Design **icon set** or select icon library (no emojis)
6. Define **seasonal theme color palettes** (Spring, Summer, Fall, Winter)
7. Design **empty states** and **error states** for all screens
