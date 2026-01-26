# Plan: UI/UX Overhaul

## Overview

Transform the Cooking Assistant from functional prototype to polished v1.0 MVP. This plan covers 9 features executed through sequential TDD rounds, establishing a design system foundation and redesigning all existing screens.

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
- [ ] Theme toggle component (temporary location: header)
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

### Layers

[Frontend, E2E]

### Acceptance Criteria

- [ ] Desktop (>=768px): 220px sidebar with logo, nav items, settings at bottom
- [ ] Desktop: Sidebar can collapse to icon-only mode (~64px)
- [ ] Desktop: Collapse state persisted to localStorage
- [ ] Mobile (<768px): Bottom tab bar with 4 tabs (Home, Cookbook, Plan, Shop)
- [ ] Mobile: Profile/settings badge in top-right header
- [ ] Active route highlighted with accent color
- [ ] Smooth transitions between collapsed/expanded states
- [ ] Navigation works correctly when resizing browser window

### Accessibility

- [ ] Sidebar navigation is keyboard navigable (Tab through items)
- [ ] Mobile tab bar items have accessible labels
- [ ] Current page indicated with aria-current="page"
- [ ] Collapse button has accessible label

### E2E

**Tests:**
- Desktop: Navigate using sidebar items
- Desktop: Collapse and expand sidebar, verify state persists
- Mobile: Navigate using bottom tabs
- Mobile: Profile accessible from header
- Responsive: Resize from desktop to mobile, navigation switches correctly

### Frontend

**Tests:**
- Sidebar renders nav items at desktop width
- Sidebar collapse button toggles width
- Mobile renders bottom tab bar instead of sidebar
- Active route shows correct styling (accent color)
- Navigation items are keyboard accessible

**Implementation:**
- Refactor `Sidebar.tsx` for new design (220px width, new styling)
- Add `MobileTabBar.tsx` component
- Use CSS media queries or `useMediaQuery` hook for responsive behavior
- Update `MainLayout.tsx` to conditionally render sidebar vs tabs
- Update E2E page objects to handle both navigation patterns

### Breaking Changes

- Current `Sidebar.tsx` structure changes significantly
- Mobile navigation changes from slide-in overlay to bottom tabs
- E2E tests using sidebar selectors need updates
- Empty state text "click New Recipe in the sidebar" becomes invalid on mobile

---

## Feature: Home Page Redesign

### Summary

Redesign the home page with AI-first layout: central chat input with suggestion chips, smart context cards (tonight's meal, shopping needed, plan week), and quick actions. AI chat is visual only — actual functionality deferred.

### Layers

[Frontend, E2E]

### Acceptance Criteria

- [ ] AI chat input centered with placeholder "What are we cooking?"
- [ ] Suggestion chips below input (horizontally scrollable on mobile)
- [ ] Clicking suggestion chip shows toast or navigates (visual feedback)
- [ ] Smart context cards with mocked data (Tonight's Meal, Plan Your Week, etc.)
- [ ] Quick actions section navigating to Cookbook, Meal Plan, Shopping
- [ ] Time-of-day greeting ("Good morning", "Good afternoon", "Good evening")
- [ ] Responsive layout (desktop 2-column, mobile stacked)
- [ ] All emojis removed, replaced with Lucide icons

### Accessibility

- [ ] Chat input has accessible label
- [ ] Suggestion chips are keyboard navigable
- [ ] Context cards are focusable and have descriptive content
- [ ] Skip link to main content

### E2E

**Tests:**
- Home page loads with chat input visible
- Suggestion chips are clickable (show toast or navigate)
- Quick actions navigate to correct pages
- Greeting displays appropriate time-of-day text

### Frontend

**Tests:**
- Chat input renders with correct placeholder
- Suggestion chips render in horizontal list
- Context cards render (mocked data)
- Quick actions navigate correctly
- Layout changes at mobile breakpoint
- No emojis present (check for emoji unicode ranges)
- Greeting shows correct time-based text

**Implementation:**
- Rebuild `HomePage.tsx` with new structure
- Create `AIChatInput.tsx` (visual component, shows toast on submit)
- Create `SuggestionChips.tsx` with sample suggestions
- Create `ContextCard.tsx` for smart context display
- Use CSS Grid for 2-column desktop layout
- Replace all emoji usage with Lucide icons

### Breaking Changes

- Current `HomePage.tsx` completely replaced
- All existing HomePage tests need rewrite
- Direct links to `/recipes` and `/login` removed from homepage

---

## Feature: Recipe Page Redesign

### Summary

Redesign the recipe detail page with hero image, ingredients panel, step-by-step instructions, and notes section. Match prototype-04-recipe.html design.

### Layers

[Frontend, E2E]

### Acceptance Criteria

- [ ] Hero image with gradient overlay and recipe title
- [ ] Fallback for recipes without images (gradient with first letter)
- [ ] Metadata bar (prep time, cook time, servings, difficulty)
- [ ] Two-column layout: ingredients (left), instructions (right)
- [ ] Steps numbered with clear visual hierarchy
- [ ] Timer buttons inline with steps that have times (visual only)
- [ ] Notes section at bottom
- [ ] Edit/Delete actions in header
- [ ] Responsive: stacks to single column on mobile

### Accessibility

- [ ] Hero image has alt text (recipe title)
- [ ] Instructions list uses semantic <ol> element
- [ ] Timer buttons have accessible labels describing the duration
- [ ] Notes section has heading for screen reader navigation

### E2E

**Tests:**
- Recipe page displays recipe title and image
- Ingredients list shows all ingredients
- Steps display in correct order with numbers
- Timer buttons appear for steps with durations
- Edit button navigates to edit page
- Delete button shows confirmation (if implemented)

### Frontend

**Tests:**
- Hero section renders image and title
- Fallback renders when no image URL
- Metadata bar shows correct values
- Ingredients render in list format
- Steps render with numbers
- Timer button renders for steps with duration
- Notes section shows existing notes
- Layout stacks on mobile width

**Implementation:**
- Rebuild `RecipeDetailPage.tsx` with new layout
- Create `RecipeHero.tsx` for hero section with fallback
- Create `IngredientsList.tsx` component
- Create `InstructionSteps.tsx` component
- Create `RecipeNotes.tsx` component
- Use CSS Grid for 2-column layout

### Breaking Changes

- Current `RecipeDetailPage.tsx` layout changes significantly
- 16 existing tests will need updates for new structure
- E2E tests in `detail.spec.ts` need selector updates

---

## Feature: Cookbook Page Redesign

### Summary

Redesign the cookbook/recipes list page with recipe card grid, collections filter, search, and sort options. Match prototype-05-cookbook.html design.

### Layers

[Frontend, E2E]

### Acceptance Criteria

- [ ] Recipe cards in responsive grid (1-4 columns based on screen)
- [ ] Each card shows image (or fallback), title, time, tags
- [ ] Search input filters recipes by title (debounced, case-insensitive)
- [ ] Sort dropdown (newest, alphabetical, cook time)
- [ ] Collections sidebar/filter (All, Favorites, Recent)
- [ ] Empty state when no recipes match search
- [ ] Empty state for new users with no recipes
- [ ] Card hover state with subtle elevation
- [ ] Recipe cards without images display gradient fallback with first letter

### Accessibility

- [ ] Search input has accessible label
- [ ] Sort dropdown is keyboard accessible
- [ ] Collection filters are keyboard navigable
- [ ] Empty state is announced to screen readers
- [ ] Recipe cards are focusable with descriptive accessible names

### E2E

**Tests:**
- Cookbook page displays recipe cards in grid
- Search filters visible recipes by title
- Sort changes card order
- Clicking card navigates to recipe detail
- Empty state displays when no recipes exist
- Empty state displays when search has no results

### Frontend

**Tests:**
- Recipe cards render in grid
- Search input filters by title (debounced)
- Sort dropdown changes order
- Empty state shows when no results
- Empty state shows for new users
- Card hover shows visual feedback (elevation)
- Fallback gradient displays for cards without images

**Implementation:**
- Refactor `RecipesPage.tsx` with new layout
- Update `RecipeCard.tsx` with new styling and fallback
- Add search state with debounce (300ms)
- Add sort state and sorting logic
- Create `EmptyState.tsx` component (reusable for other pages)
- Update empty state text to be responsive-aware (no "sidebar" reference on mobile)

### Breaking Changes

- Current `RecipesPage.tsx` layout changes significantly
- Current `RecipeCard.tsx` restyled
- 18 RecipesPage tests + 19 RecipeCard tests may need updates
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

Add seasonal color variations (Spring, Summer, Fall, Winter) that adjust accent colors and subtle background tints. Users can select their preferred season in settings.

### Layers

[Frontend]

### Acceptance Criteria

- [ ] Four seasonal themes with distinct accent colors
- [ ] Spring: #66bb6a (fresh green)
- [ ] Summer: #ffa726 (warm orange)
- [ ] Fall: #e07850 (coral - default)
- [ ] Winter: #5c9dc4 (cool blue)
- [ ] Season selector in settings page
- [ ] Season preference persisted to localStorage
- [ ] Smooth transition when changing seasons (300ms)
- [ ] Works correctly in both light and dark modes
- [ ] Accent-subtle colors adjust per season

### Accessibility

- [ ] Season selector is keyboard accessible
- [ ] Season names are clearly labeled (not just colors)
- [ ] Color is not the only indicator of selected season (add checkmark or border)

### Frontend

**Tests:**
- Season selector renders four options
- Selecting season updates CSS variables (--accent changes)
- Season persists across page reloads
- Each season has distinct accent color
- Seasonal themes work in both light and dark modes

**Implementation:**
- Extend `ThemeContext` with `season` state
- Define seasonal color palettes in theme.css
- Add `[data-season="spring"]` etc. selectors
- Create `SeasonPicker.tsx` component for settings
- Update SettingsPage to include season picker
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
