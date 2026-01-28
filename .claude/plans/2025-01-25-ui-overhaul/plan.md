# Plan: UI/UX Overhaul

**Status:** Revision Required — see brainstorm.md "Lessons Learned" section

## Overview

Transform the Cooking Assistant from functional prototype to polished v1.0 MVP. This plan covers 9 features executed through sequential TDD rounds, establishing a design system foundation and redesigning all existing screens.

**CRITICAL: Prototypes are the source of truth.** Each screen feature includes a Visual Verification section. Implementers MUST open the referenced prototype HTML file and verify every element matches before marking a feature complete.

**Scope includes:**
- Design system infrastructure (CSS tokens, theming, light+dark modes)
- Token migration (systematic migration of existing components)
- Component library with new styling
- Navigation overhaul (desktop sidebar, mobile tabs)
- Screen redesigns: Home, Recipe, Cookbook
- Animation system
- Seasonal theme variations

**Out of scope (separate issues to be created):**
- Meal Plan page (new feature)
- Shopping page (new feature)
- AI chat functionality (visual placeholder only in this plan)
- Cooking Mode (needs prototype first)
- Onboarding flow

## Feature Order

1. **Design System Infrastructure** (no dependencies)
2. **Design Token Migration** (depends on #1)
3. **Component Library** (depends on #1, #2)
4. **Navigation Overhaul** (depends on #1, #2, #3)
5. **Home Page Redesign** (depends on #1, #2, #3, #4)
6. **Recipe Page Redesign** (depends on #1, #2, #3, #4)
7. **Cookbook Page Redesign** (depends on #1, #2, #3, #4)
8. **Animation System** (depends on #1, execute after #5-7)
9. **Seasonal Themes** (depends on #1)

---

## Closed Decisions

These questions from the brainstorm/review are now resolved:

| Question | Decision |
|----------|----------|
| Icon library | **Lucide** (already in use in codebase) |
| Mobile breakpoint | **768px** (standard tablet/phone boundary) |
| Timer buttons | **Visual only** — functional timers deferred to Cooking Mode |
| Light mode colors | **Defined in prototype-08-color-palette.html** — warm cream palette |
| Seasonal colors | **Defined in prototype-08** — Spring (#66bb6a), Summer (#ffa726), Fall (#e07850), Winter (#5c9dc4) |
| Image fallbacks | **Gradient with first letter** of recipe name |

---

## Feature: Design System Infrastructure

### Summary

Establish the theming infrastructure: CSS custom properties for colors, typography, and spacing. Implement light/dark mode toggle with system preference detection. This feature creates the foundation; migration happens in the next feature.

### Layers

[Frontend]

### Acceptance Criteria

- [ ] CSS custom properties defined for all design tokens (see Color Palette below)
- [ ] Light and dark mode themes with correct color values
- [ ] Theme toggle component in Settings page (not header)
- [ ] System preference detection (prefers-color-scheme) on first visit
- [ ] Theme preference persisted to localStorage
- [ ] ThemeContext provides `theme`, `setTheme`, `toggleTheme`
- [ ] CSS variables applied via `[data-theme="light"]` / `[data-theme="dark"]` on document root
- [ ] Tailwind config updated to reference CSS variables

### Color Palette (from prototype-08)

**Dark Mode:**
```css
--bg-primary: #1a1918;
--bg-secondary: #242321;
--bg-card: #2a2927;
--bg-hover: #353432;
--text-primary: #f5f5f5;
--text-secondary: #a0a0a0;
--text-muted: #6b6b6b;
--text-placeholder: #555555;
--border: #3a3a3a;
--border-focus: #555555;
--accent: #e07850;
--accent-hover: #c96842;
--accent-subtle: rgba(224, 120, 80, 0.15);
```

**Light Mode:**
```css
--bg-primary: #faf9f7;
--bg-secondary: #f5f4f2;
--bg-card: #ffffff;
--bg-hover: #f0efed;
--text-primary: #1a1918;
--text-secondary: #5a5a5a;
--text-muted: #8a8a8a;
--text-placeholder: #b0b0b0;
--border: #e5e4e2;
--border-focus: #c0c0c0;
--accent: #e07850;
--accent-hover: #c96842;
--accent-subtle: rgba(224, 120, 80, 0.1);
```

### Accessibility

- [ ] Focus indicators visible in both themes (3px outline using --accent-subtle)
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components)
- [ ] Theme toggle accessible via keyboard (Tab + Enter/Space)

### Frontend

**Tests:**
- ThemeContext provides current theme and toggle function
- Theme toggle switches between light/dark modes
- Theme persists across page reloads (localStorage)
- System preference is respected on first visit (no stored preference)
- CSS custom properties are applied to document root
- Theme toggle is keyboard accessible

**Implementation:**
- Create `contexts/ThemeContext.tsx`
- Create `theme.css` with CSS variable definitions
- Create `components/ui/ThemeToggle.tsx`
- Update `tailwind.config.ts` to use CSS variables for colors
- Add `data-theme` attribute handling to `App.tsx` or `index.html`

### Breaking Changes

- Tailwind color classes will reference CSS variables instead of hardcoded values
- Existing components will still work but may look inconsistent until migrated

---

## Feature: Design Token Migration

### Summary

Systematically migrate all existing components from hardcoded Tailwind color classes to semantic design tokens. This is a code migration feature with no new UI.

### Layers

[Frontend]

### Acceptance Criteria

- [ ] All pages render correctly in both light and dark themes
- [ ] No hardcoded color classes remain (bg-white, text-neutral-*, bg-primary-*, etc.)
- [ ] All semantic colors use token classes (bg-primary, text-primary, etc.)
- [ ] Existing tests pass (may need color assertion updates)

### Pages to Migrate

1. HomePage.tsx
2. RecipesPage.tsx
3. RecipeDetailPage.tsx
4. CreateRecipePage.tsx
5. EditRecipePage.tsx
6. LibrariesPage.tsx
7. LibraryDetailPage.tsx
8. SettingsPage.tsx
9. LoginPage.tsx
10. SharedRecipePage.tsx

### Components to Migrate

1. Sidebar.tsx and related (SidebarItem, SidebarSection, etc.)
2. TopBar.tsx
3. MainLayout.tsx
4. RecipeCard.tsx
5. RecipeForm.tsx
6. ChatPanel.tsx and ChatMessage.tsx
7. ShareModal.tsx
8. FeedbackButton.tsx and FeedbackModal.tsx
9. ErrorBoundary.tsx

### Accessibility

- [ ] Focus states use --accent-subtle for focus rings
- [ ] Error states use --error color token
- [ ] Success states use --success color token

### Frontend

**Tests:**
- Visual regression: Pages look correct in light mode
- Visual regression: Pages look correct in dark mode
- Existing functional tests pass (update color assertions as needed)

**Implementation:**
- Search and replace hardcoded classes with semantic tokens
- Update test assertions that check for specific color classes
- Verify each page manually in both themes

### Breaking Changes

- Tests asserting specific color classes (bg-success-100, text-error-700, etc.) will need updates
- ~63 frontend tests may need assertion changes

---

## Feature: Component Library

### Summary

Build reusable UI components (Button, Card, Input, Tag/Badge) styled according to the design system. These replace ad-hoc styling throughout the app.

### Layers

[Frontend]

### Acceptance Criteria

- [ ] Button component with primary, secondary, ghost, danger variants
- [ ] Button supports disabled state (visually distinct, not interactive)
- [ ] Button supports loading state with spinner
- [ ] Card component with hover state (glow border effect)
- [ ] Input component with placeholder, focus, error, disabled states
- [ ] Tag/Badge components for metadata display
- [ ] All components support light and dark themes
- [ ] Components have accessible focus indicators
- [ ] Components are keyboard navigable

### Accessibility

- [ ] All interactive components have visible focus indicators
- [ ] Disabled components have `aria-disabled="true"` and `tabindex="-1"`
- [ ] Error states announced to screen readers (aria-invalid, aria-describedby)
- [ ] Loading buttons have aria-busy="true"

### Frontend

**Tests:**
- Button renders correct variant styles (primary, secondary, ghost, danger)
- Button shows hover/active states
- Button shows disabled state (cursor, opacity, not clickable)
- Button shows loading state with spinner
- Card renders with correct background and border
- Card shows hover glow effect
- Input shows focus ring on focus
- Input shows error state when invalid
- Input shows disabled state
- Tag renders with muted background
- Components render correctly in both themes
- All components accessible via keyboard

**Implementation:**
- Create `components/ui/` directory for design system components
- Button: `variant` prop (primary, secondary, ghost, danger), `size` prop, `isLoading`, `isDisabled`
- Card: Composable with Card, CardHeader, CardContent, CardFooter
- Input: Wraps native input with proper styling, supports `error` prop
- Tag: Small, muted background
- Badge: Accent color, pill shape

### Breaking Changes

- Existing Button/Card/IconButton components in `components/common/ui/` will be replaced
- Pages using old components need imports updated
- Button variant "outline" removed (use "secondary" instead)

---

## Feature: Navigation Overhaul

### Summary

Implement the new navigation structure: collapsible desktop sidebar (left) and mobile bottom tab bar. Includes responsive behavior and active state indicators.

**Prototype reference:** All prototypes show the correct sidebar structure (Home, Cookbook, Meal Plan, Shopping, Settings).

### Layers

[Frontend, E2E]

### Acceptance Criteria

**Sidebar Structure (MUST match prototypes):**
- [ ] Logo "CookingAssistant" links to `/home` (not `/recipes`)
- [ ] Nav items in this exact order:
  1. Home → `/home` (icon: `Home`)
  2. Cookbook → `/recipes` (icon: `BookOpen`)
  3. Meal Plan → `/planning` (icon: `Calendar`)
  4. Shopping → `/shopping` (icon: `ShoppingCart`)
- [ ] Settings at bottom of sidebar → `/settings` (icon: `Settings`)
- [ ] **Remove** old nav items: My Recipes, Libraries, Discover, Cook Mode

**Desktop Behavior (>=768px):**
- [ ] 220px sidebar width when expanded
- [ ] Sidebar can collapse to icon-only mode (~64px)
- [ ] Collapse state persisted to localStorage
- [ ] "New Recipe" button at bottom of sidebar

**Mobile Behavior (<768px):**
- [ ] Bottom tab bar with 4 tabs: Home, Cookbook, Plan, Shop
- [ ] Profile/settings accessible from top-right header
- [ ] No sidebar on mobile

**Visual:**
- [ ] Active route highlighted with accent color
- [ ] Smooth transitions between collapsed/expanded states (200ms)
- [ ] Navigation works correctly when resizing browser window

### Accessibility

- [ ] Sidebar navigation is keyboard navigable (Tab through items)
- [ ] Mobile tab bar items have accessible labels
- [ ] Current page indicated with aria-current="page"
- [ ] Collapse button has accessible label

### E2E

**Tests:**
- Desktop: Navigate to Home using sidebar, verify URL is `/home`
- Desktop: Logo click navigates to `/home`
- Desktop: Navigate using all sidebar items (Cookbook, Meal Plan, Shopping, Settings)
- Desktop: Collapse and expand sidebar, verify state persists
- Mobile: Navigate using bottom tabs
- Mobile: Profile accessible from header
- Responsive: Resize from desktop to mobile, navigation switches correctly

### Frontend

**Tests:**
- Sidebar renders exactly 4 main nav items + Settings
- Logo links to `/home`
- Sidebar does NOT contain "My Recipes", "Libraries", "Discover", "Cook Mode"
- Sidebar collapse button toggles width
- Mobile renders bottom tab bar instead of sidebar
- Active route shows correct styling (accent color)
- Navigation items are keyboard accessible

**Implementation:**
- Rewrite `Sidebar.tsx` with new nav structure (not refactor — replace)
- Update logo link from `/recipes` to `/home`
- Remove: SidebarSection groupings, Libraries, Discover, Cook Mode items
- Add `MobileTabBar.tsx` component
- Use CSS media queries or `useMediaQuery` hook for responsive behavior
- Update `MainLayout.tsx` to conditionally render sidebar vs tabs
- Update E2E page objects to handle both navigation patterns

### Visual Verification

Before marking complete, open any prototype HTML file and verify:
- [ ] Sidebar has exactly: Home, Cookbook, Meal Plan, Shopping (+ Settings at bottom)
- [ ] No extra nav items exist
- [ ] Logo click goes to Home

### Breaking Changes

- Current `Sidebar.tsx` completely rewritten
- Mobile navigation changes from slide-in overlay to bottom tabs
- E2E tests using sidebar selectors need updates
- Empty state text "click New Recipe in the sidebar" becomes invalid on mobile

---

## Feature: Home Page Redesign

### Summary

Redesign the home page with AI-first layout: central chat input with suggestion chips, smart context cards (tonight's meal, week preview), and quick actions. AI chat is visual only — actual functionality deferred.

**Prototype reference:** `.claude/plans/2025-01-25-ui-overhaul/prototype-02-home-ai-first.html`

### Layers

[Frontend, E2E]

### Acceptance Criteria

**Header:**
- [ ] Time-of-day greeting ("Good morning", "Good afternoon", "Good evening")
- [ ] Current date displayed below greeting

**AI Chat Input:**
- [ ] Centered input with placeholder "What are we cooking?"
- [ ] "Go" button with send icon on right side of input
- [ ] Clicking Go or pressing Enter shows toast (AI functionality deferred)

**Suggestion Chips:**
- [ ] 4 chips in a row: "Plan next week's meals", "What can I make with chicken?", "Find a quick dinner recipe", "Add recipe from URL"
- [ ] Horizontally scrollable on mobile
- [ ] Clicking chip shows toast or navigates (visual feedback)

**Context Cards (two-column layout on desktop):**
- [ ] "Tonight's Dinner" card (left column):
  - "Ready" badge
  - "Planned for 6:30 PM" subtitle
  - Recipe photo placeholder (or gradient fallback with icon)
  - Recipe title (e.g., "Honey Garlic Salmon")
  - Metadata: time, servings, difficulty (e.g., "35 min · 4 servings · Medium")
  - "Start Cooking" button (primary/accent)
  - "View Recipe" button (secondary/outline)
- [ ] "This Week" card (right column):
  - Week preview list (Fri, Today, Sun, Mon, Tue)
  - "Today" row highlighted with accent color
  - "Not planned" shown for empty days
  - "View full plan →" link at bottom

**Quick Actions (below context cards):**
- [ ] Three action cards in a column:
  1. "Go Shopping" — icon: `ShoppingCart`, subtitle: "12 items across 2 stores"
  2. "Add Recipe" — icon: `Plus`, subtitle: "Import or create new"
  3. "Recent Reflection" — icon: `MessageSquare`, subtitle: "Pasta was too salty — noted"
- [ ] Each card has arrow icon on right indicating navigation

**Layout:**
- [ ] Desktop: Context cards side-by-side (2 columns)
- [ ] Mobile: Everything stacked vertically
- [ ] All emojis removed, replaced with Lucide icons

### Accessibility

- [ ] Chat input has accessible label
- [ ] Suggestion chips are keyboard navigable
- [ ] Context cards are focusable and have descriptive content
- [ ] Skip link to main content

### E2E

**Tests:**
- Home page loads at `/home` with chat input visible
- Suggestion chips are clickable (show toast or navigate)
- "Start Cooking" and "View Recipe" buttons visible on dinner card
- Quick actions (Go Shopping, Add Recipe, Recent Reflection) are present
- Greeting displays appropriate time-of-day text

### Frontend

**Tests:**
- Chat input renders with placeholder "What are we cooking?"
- Suggestion chips render exactly 4 chips
- Tonight's Dinner card shows: title, time, servings, difficulty, two buttons
- This Week card shows 5 days with "Today" highlighted
- Quick actions render 3 cards: Go Shopping, Add Recipe, Recent Reflection
- Layout is 2-column on desktop (>=768px)
- Layout stacks on mobile (<768px)
- No emojis present (check for emoji unicode ranges)
- Greeting shows correct time-based text

**Implementation:**
- Rebuild `HomePage.tsx` with new structure
- Create `AIChatInput.tsx` (visual component, shows toast on submit)
- Create `SuggestionChips.tsx` with exactly 4 suggestions
- Create `ContextCard.tsx` for smart context display
- Create `QuickActionCard.tsx` for action items
- Use CSS Grid for 2-column desktop layout
- Replace all emoji usage with Lucide icons

### Visual Verification

Before marking complete, open `prototype-02-home-ai-first.html` and verify:
- [ ] Greeting + date matches layout
- [ ] AI input + suggestion chips match
- [ ] Tonight's Dinner card has photo placeholder, title, metadata, TWO buttons
- [ ] This Week card has day list with "Today" highlighted
- [ ] Quick Actions are: Go Shopping, Add Recipe, Recent Reflection (NOT Cookbook/Meal Plan/Shopping)
- [ ] Two-column layout for context cards on desktop

### Breaking Changes

- Current `HomePage.tsx` completely replaced
- All existing HomePage tests need rewrite
- Direct links to `/recipes` and `/login` removed from homepage

---

## Feature: Recipe Page Redesign

### Summary

Redesign the recipe detail page with hero image, ingredients panel, step-by-step instructions, and notes section.

**Prototype reference:** `.claude/plans/2025-01-25-ui-overhaul/prototype-04-recipe.html`

### Layers

[Frontend, E2E]

### Acceptance Criteria

**Hero Section:**
- [ ] Hero image with gradient overlay (from-transparent to-black/70)
- [ ] Fallback for recipes without images (gradient with first letter)
- [ ] Recipe title overlaid on hero (bottom)
- [ ] Back button (top-left, semi-transparent background)
- [ ] Action buttons (top-right): Favorite/heart, Share, More menu

**Metadata (in hero overlay):**
- [ ] Total time (e.g., "35 min total")
- [ ] Servings (e.g., "4 servings")
- [ ] Difficulty (e.g., "Medium difficulty")
- [ ] Calories (e.g., "520 cal/serving") — display if available

**Ingredients Panel (left column, sticky):**
- [ ] Panel title "Ingredients"
- [ ] Servings adjuster: +/- buttons to scale ingredient quantities
- [ ] Ingredient list with checkboxes (visual state, can be checked off)
- [ ] Each ingredient shows: amount (accent color), name
- [ ] "Add to Shopping List" button at bottom of panel

**Instructions (right column):**
- [ ] Section title "Instructions"
- [ ] Numbered steps with step number in circle
- [ ] Step text with comfortable line height
- [ ] Timer buttons inline with steps that have durations (visual only)
- [ ] Timer button shows clock icon + duration (e.g., "Set 12 min timer")

**Tags Section:**
- [ ] Section title "Tags"
- [ ] Tags displayed as pills (e.g., "High Protein", "Weeknight", "Healthy")

**Notes & Reflections Section:**
- [ ] Section title "Notes & Reflections"
- [ ] Existing notes displayed as cards with date and label
- [ ] "Add a note" button (dashed border style)

**Fixed Bottom Bar:**
- [ ] "Start Cooking" CTA bar fixed at bottom of viewport
- [ ] Left side: "Ready to cook? Guided mode will walk you through each step."
- [ ] Right side: "Start Cooking" button (primary/accent) with play icon

**Layout:**
- [ ] Desktop: Two-column (ingredients 320px, instructions flex)
- [ ] Mobile: Stacks to single column
- [ ] Ingredients panel is sticky on desktop (stays visible while scrolling)

### Accessibility

- [ ] Hero image has alt text (recipe title)
- [ ] Instructions list uses semantic `<ol>` element
- [ ] Timer buttons have accessible labels describing the duration
- [ ] Notes section has heading for screen reader navigation
- [ ] Ingredient checkboxes are keyboard accessible
- [ ] Servings adjuster buttons have accessible labels

### E2E

**Tests:**
- Recipe page displays recipe title and image
- Ingredients list shows all ingredients with checkboxes
- Servings adjuster +/- buttons are visible
- "Add to Shopping List" button is visible
- Steps display in correct order with numbers
- Timer buttons appear for steps with durations
- "Start Cooking" bar is visible at bottom
- Edit button navigates to edit page

### Frontend

**Tests:**
- Hero section renders image and title
- Fallback renders when no image URL
- Favorite/heart button renders in hero
- Metadata shows time, servings, difficulty in hero overlay
- Servings adjuster renders with +/- buttons
- Ingredients render with checkboxes
- Checking ingredient toggles visual state
- "Add to Shopping List" button renders
- Steps render with numbers in circles
- Timer button renders for steps with duration
- Notes section shows existing notes
- "Add a note" button renders
- "Start Cooking" bar is fixed at bottom
- Layout stacks on mobile width

**Implementation:**
- Rebuild `RecipeDetailPage.tsx` with new layout
- Create `RecipeHero.tsx` for hero section with fallback and action buttons
- Create `IngredientsList.tsx` with checkboxes and servings adjuster
- Create `InstructionSteps.tsx` component
- Create `RecipeNotes.tsx` with "Add a note" button
- Create `StartCookingBar.tsx` fixed bottom CTA
- Use CSS Grid for 2-column layout
- Implement sticky positioning for ingredients panel

### Visual Verification

Before marking complete, open `prototype-04-recipe.html` and verify:
- [ ] Hero has back button (left), action buttons (right: heart, share, menu)
- [ ] Metadata in hero: time, servings, difficulty, calories
- [ ] Ingredients panel has servings adjuster (+/- buttons)
- [ ] Ingredients have checkboxes
- [ ] "Add to Shopping List" button at bottom of ingredients
- [ ] Timer buttons on relevant steps
- [ ] Notes section has "Add a note" button
- [ ] Fixed "Start Cooking" bar at bottom

### Breaking Changes

- Current `RecipeDetailPage.tsx` layout changes significantly
- 16 existing tests will need updates for new structure
- E2E tests in `detail.spec.ts` need selector updates

---

## Feature: Cookbook Page Redesign

### Summary

Redesign the cookbook/recipes list page with recipe card grid, collections, search, and sort options.

**Prototype reference:** `.claude/plans/2025-01-25-ui-overhaul/prototype-05-cookbook.html`

### Layers

[Frontend, E2E]

### Acceptance Criteria

**Header:**
- [ ] Page title "Cookbook"
- [ ] "Import" button (secondary style) with upload icon
- [ ] "New Recipe" button (primary style) with plus icon

**Collections Section (horizontal scroll):**
- [ ] Section title "Collections" with "Manage →" link
- [ ] Horizontally scrollable collection cards
- [ ] Each collection card shows: icon, name, recipe count
- [ ] Collection cards use Lucide icons (NO emojis):
  - Favorites: `Heart` icon
  - Quick Meals: `Zap` icon
  - Healthy: `Salad` icon
  - Party Food: `PartyPopper` icon
  - New Collection: `Plus` icon
- [ ] Clicking collection filters recipes

**Search & Filters Row:**
- [ ] Search input with search icon inside (left side of input)
- [ ] "Filters" button that shows/hides filter panel
- [ ] View toggle: grid view / list view icons
- [ ] Active view indicated with background highlight

**Active Filter Tags:**
- [ ] Active filters shown as pills below search row
- [ ] Each pill has filter text + "×" remove button
- [ ] Clicking "×" removes that filter
- [ ] Example: "Under 30 min ×", "High Protein ×"

**Results Info Row:**
- [ ] Results count (e.g., "24 recipes")
- [ ] Sort dropdown: "Recently Added", "Alphabetical", "Cook Time", "Most Cooked"

**Recipe Cards Grid:**
- [ ] Responsive grid (1-4 columns based on screen width)
- [ ] Each card shows:
  - Image (or gradient fallback with first letter)
  - Time badge overlaid on image (top-right, e.g., "35 min")
  - Favorite heart icon overlaid on image (top-left, filled if favorited)
  - Title
  - Metadata: servings, difficulty
  - Tags as small pills
- [ ] Card hover: subtle elevation + border color change

**Empty States:**
- [ ] Empty state when no recipes match search/filters
- [ ] Empty state for new users with no recipes
- [ ] Empty state includes illustration/icon and helpful text

### Accessibility

- [ ] Search input has accessible label
- [ ] Sort dropdown is keyboard accessible
- [ ] View toggle buttons have accessible labels
- [ ] Collection cards are keyboard navigable
- [ ] Filter tag remove buttons have accessible labels
- [ ] Empty state is announced to screen readers
- [ ] Recipe cards are focusable with descriptive accessible names

### E2E

**Tests:**
- Cookbook page displays at `/recipes`
- Collections section is visible with scrollable cards
- Search filters visible recipes by title
- Filter tags appear when filters active, can be removed
- View toggle switches between grid and list
- Sort changes card order
- Clicking card navigates to recipe detail
- Empty state displays when no recipes exist
- Empty state displays when search has no results

### Frontend

**Tests:**
- Page title is "Cookbook" (not "My Recipes")
- "Import" and "New Recipe" buttons render in header
- Collections section renders with 5 collection cards
- Collection cards use Lucide icons (not emojis)
- Search input has search icon inside
- View toggle renders grid/list buttons
- Active filter tags render as removable pills
- Recipe cards render in grid
- Recipe cards show time badge on image
- Recipe cards show favorite heart on image
- Search input filters by title (debounced)
- Sort dropdown changes order
- Empty state shows when no results
- Card hover shows visual feedback
- Fallback gradient displays for cards without images

**Implementation:**
- Rebuild `RecipesPage.tsx` with new layout (not refactor — replace)
- Create `CollectionsSection.tsx` with horizontal scroll
- Create `CollectionCard.tsx` with Lucide icons
- Update search to have icon inside input
- Create `FilterTags.tsx` for active filter pills
- Create `ViewToggle.tsx` for grid/list switch
- Update `RecipeCard.tsx` with:
  - Time badge overlay
  - Favorite heart overlay
  - New hover state
- Create `EmptyState.tsx` component (reusable)
- Update empty state text to be responsive-aware

### Visual Verification

Before marking complete, open `prototype-05-cookbook.html` and verify:
- [ ] Header has "Cookbook" title, Import button, New Recipe button
- [ ] Collections section with horizontal scroll
- [ ] Collection icons are Lucide icons (Heart, Zap, Salad, PartyPopper, Plus) — NOT emojis
- [ ] Search input has icon inside
- [ ] Filters button and View toggle present
- [ ] Active filter tags shown as removable pills
- [ ] Recipe cards have time badge AND favorite heart overlaid on image
- [ ] Grid/list view toggle works

### Breaking Changes

- Current `RecipesPage.tsx` completely rewritten
- Current `RecipeCard.tsx` restyled significantly
- 18 RecipesPage tests + 19 RecipeCard tests need rewrites
- E2E tests in `list.spec.ts` need selector updates

---

## Feature: Animation System

### Summary

Implement micro-interactions, transitions, and celebration animations as defined in the brainstorm. Uses CSS animations and transitions, with Framer Motion for complex sequences.

### Layers

[Frontend]

### Prerequisites

- Install framer-motion: `npm install framer-motion`

### Acceptance Criteria

- [ ] Button hover: scale pop effect (transform: scale(1.02))
- [ ] Button click: glow burst
- [ ] Card hover: glow border effect (accent-colored shadow)
- [ ] Loading states: skeleton shimmer animation
- [ ] Checkbox: bounce animation on check
- [ ] Toggle: smooth slide with slight overshoot
- [ ] List items: staggered slide-in on page load
- [ ] Modal: scale-in with overlay fade
- [ ] Success actions: burst animation
- [ ] Favorites: heart pop animation
- [ ] Input error: shake animation
- [ ] All animations respect `prefers-reduced-motion`

### Timing Guidelines

```css
/* Standard interactions */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--easing-default: cubic-bezier(0.4, 0, 0.2, 1);
--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Accessibility

- [ ] All animations disabled when `prefers-reduced-motion: reduce`
- [ ] No animation causes content to flash more than 3 times per second
- [ ] Motion-triggered state changes have non-animated fallbacks

### Frontend

**Tests:**
- Animated components have correct CSS classes/keyframes
- Animations respect `prefers-reduced-motion` (verify via media query mock)
- Skeleton loading shows shimmer effect
- Modal animates on open/close (framer-motion)
- Button has hover scale effect

**Implementation:**
- Create `animations.css` with keyframe definitions
- Create CSS utility classes for common animations
- Update Button, Card, Input components with animation classes
- Create `Skeleton.tsx` loading component with shimmer
- Update Modal component with framer-motion entrance/exit
- Add `useReducedMotion` hook for programmatic checks

### Breaking Changes

- None expected — additive feature

---

## Feature: Seasonal Themes

### Summary

Add seasonal color variations (Spring, Summer, Fall, Winter) that adjust accent colors and subtle background tints. Users select their preferred season in the Settings page.

### Layers

[Frontend]

### Acceptance Criteria

**Seasonal Colors:**
- [ ] Four seasonal themes with distinct accent colors:
  - Spring: #66bb6a (fresh green)
  - Summer: #ffa726 (warm orange)
  - Fall: #e07850 (coral - default)
  - Winter: #5c9dc4 (cool blue)
- [ ] Accent-subtle colors adjust per season
- [ ] Works correctly in both light and dark modes
- [ ] Smooth transition when changing seasons (300ms)

**Settings Page Integration:**
- [ ] Season picker in Settings page (below theme toggle)
- [ ] Four season options displayed as selectable cards or buttons
- [ ] Each option shows: season name, color swatch
- [ ] Selected season indicated with checkmark AND border (not color alone)
- [ ] Season preference persisted to localStorage

### Accessibility

- [ ] Season selector is keyboard accessible
- [ ] Season names are clearly labeled (not just colors)
- [ ] Color is not the only indicator of selected season (checkmark + border)
- [ ] Focus visible on season options

### Frontend

**Tests:**
- Season picker renders in Settings page
- Season picker renders four options (Spring, Summer, Fall, Winter)
- Each option shows season name
- Selecting season updates CSS variables (--accent changes)
- Selected season shows checkmark indicator
- Season persists across page reloads
- Each season has distinct accent color
- Seasonal themes work in both light and dark modes

**Implementation:**
- Extend `ThemeContext` with `season` state
- Define seasonal color palettes in theme.css
- Add `[data-season="spring"]` etc. selectors
- Create `SeasonPicker.tsx` component
- Add SeasonPicker to SettingsPage (in Appearance section with theme toggle)
- CSS variables cascade: mode sets base colors, season overrides accent

### Breaking Changes

- None expected — extends existing theme system

---

## Issues to Create (Out of Scope)

After this plan is approved, create GitHub issues for:

1. **Meal Plan Page** — Weekly calendar with AI suggestions (new feature)
2. **Shopping Page** — Per-store lists, pantry check, AI substitutions (new feature)
3. **AI Chat Functionality** — Backend integration for home page chat input
4. **Cooking Mode** — Full-screen step-by-step cooking experience (needs prototype)
5. **Onboarding Flow** — First-time user setup experience

---

## Test Migration Summary

Based on migration risk review, these test files will need updates:

| Feature | Test Files Affected | Estimated Tests |
|---------|---------------------|-----------------|
| Token Migration | RecipeCard.test.tsx, RecipeDetailPage.test.tsx | ~35 |
| Navigation | E2E viewports.spec.ts, workflow specs | ~11 |
| Home Page | HomePage.test.tsx | ~10 |
| Recipe Page | RecipeDetailPage.test.tsx, E2E detail.spec.ts | ~25 |
| Cookbook Page | RecipesPage.test.tsx, RecipeCard.test.tsx, E2E list.spec.ts | ~49 |

**Total estimated test updates:** ~130 tests (frontend + E2E)
