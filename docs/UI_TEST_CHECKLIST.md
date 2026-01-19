# UI Test Checklist

Manual visual/interaction verification before PR approval.
**Time**: ~5-10 minutes
**When**: Any PR touching frontend UI components, pages, or styles

---

## Setup

```bash
# Terminal 1: Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open browser to `http://localhost:5173` with DevTools ready (F12).

---

## 1. Layout & Navigation

### Sidebar (Desktop: >= 1024px)

| Check | Expected | Pass |
|-------|----------|------|
| Sidebar visible | Fixed left, 280px width | [ ] |
| Collapse button works | Animates to 64px width, ~200ms | [ ] |
| Collapsed state | Icons only, no text labels | [ ] |
| Tooltips on collapsed | Hover shows label tooltip | [ ] |
| Active route highlight | `bg-primary-100`, `text-primary-700` | [ ] |
| Section headers | Visible when expanded, hidden when collapsed | [ ] |
| Action button (bottom) | Sticky, visible in both states | [ ] |

### Sidebar (Mobile: < 1024px)

| Check | Expected | Pass |
|-------|----------|------|
| Sidebar hidden by default | No sidebar visible | [ ] |
| Hamburger menu in top bar | Visible, tappable | [ ] |
| Menu opens as overlay | Slides from left, backdrop dims | [ ] |
| Tap backdrop closes | Returns to hidden state | [ ] |
| Navigation works | Tapping item navigates + closes menu | [ ] |

### Top Bar

| Check | Expected | Pass |
|-------|----------|------|
| Logo/branding | Left aligned, clickable to home | [ ] |
| User greeting | Shows username when logged in | [ ] |
| Logout button | Visible, functional | [ ] |
| Height | 64px (h-16) | [ ] |

---

## 2. Visual Design

### Colors (Reference: `tailwind.config.js`)

| Element | Expected Color | Pass |
|---------|----------------|------|
| Primary buttons | `#ec6b42` (primary-500) | [ ] |
| Primary hover | `#d94f28` (primary-600) | [ ] |
| Body text | `#706658` (neutral-600) | [ ] |
| Headings | `#584f44` (neutral-700) | [ ] |
| Page background | `#faf9f7` (neutral-50) | [ ] |
| Card background | `#ffffff` or `#f5f3f0` (neutral-100) | [ ] |
| Borders/dividers | `#e8e4df` (neutral-200) | [ ] |
| Success states | `#539557` (success-500) | [ ] |
| Error states | `#dc4545` (error-500) | [ ] |
| Warning states | `#eab308` (warning-500) | [ ] |

### Typography

| Element | Expected | Pass |
|---------|----------|------|
| Body font | Inter | [ ] |
| Heading font | DM Sans | [ ] |
| Base size | 16px (1rem) | [ ] |
| Line height | 1.5 for body text | [ ] |
| No text overflow | All text readable, no clipping | [ ] |

### Shadows

| Element | Expected Shadow | Pass |
|---------|-----------------|------|
| Cards | `shadow-soft` (subtle, warm-tinted) | [ ] |
| Modals | `shadow-soft-lg` (more prominent) | [ ] |
| Dropdowns | `shadow-soft-md` | [ ] |
| No harsh shadows | All shadows diffused, not solid | [ ] |

### Border Radius

| Element | Expected | Pass |
|---------|----------|------|
| Buttons | `rounded-md` (10px) or `rounded-lg` (12px) | [ ] |
| Cards | `rounded-lg` (12px) or `rounded-xl` (16px) | [ ] |
| Inputs | `rounded-md` (10px) | [ ] |
| Modals | `rounded-xl` (16px) or `rounded-2xl` (20px) | [ ] |

---

## 3. Components

### Recipe Cards

| Check | Expected | Pass |
|-------|----------|------|
| Image area | Aspect ratio maintained, placeholder if none | [ ] |
| Title | Truncates with ellipsis if too long | [ ] |
| Metadata icons | Clock (time), Users (servings) - not text | [ ] |
| Tags/badges | Rounded pills, consistent styling | [ ] |
| Hover state | Slight lift (translateY or shadow increase) | [ ] |
| Click target | Entire card clickable | [ ] |

### Card Grid

| Check | Expected | Pass |
|-------|----------|------|
| Gap | 24px (`gap-6`) between cards | [ ] |
| Columns (mobile) | 1 column | [ ] |
| Columns (tablet) | 2 columns | [ ] |
| Columns (desktop) | 3-4 columns | [ ] |
| Alignment | Cards align to grid, no orphan spacing | [ ] |

### Buttons

| Check | Expected | Pass |
|-------|----------|------|
| Primary | Terracotta bg, white text | [ ] |
| Primary hover | Darker terracotta, cursor pointer | [ ] |
| Secondary/outline | Border only, transparent bg | [ ] |
| Disabled | Reduced opacity, no pointer | [ ] |
| Loading state | Spinner or disabled appearance | [ ] |
| Min touch target | 44px height on mobile | [ ] |

### Form Inputs

| Check | Expected | Pass |
|-------|----------|------|
| Default state | Neutral border, white bg | [ ] |
| Focus state | Primary-colored ring (`shadow-focus`) | [ ] |
| Error state | Red border, error message below | [ ] |
| Placeholder | Neutral-400 color | [ ] |
| Labels | Above input, clear association | [ ] |

### Modals

| Check | Expected | Pass |
|-------|----------|------|
| Backdrop | Semi-transparent dark overlay | [ ] |
| Centered | Vertically and horizontally | [ ] |
| Close button | Top-right X icon | [ ] |
| Escape key | Closes modal | [ ] |
| Click outside | Closes modal | [ ] |
| Focus trap | Tab stays within modal | [ ] |

---

## 4. Interactions

### Animations & Transitions

| Check | Expected | Pass |
|-------|----------|------|
| Duration | ~200ms for micro-interactions | [ ] |
| Easing | Smooth (cubic-bezier), not linear | [ ] |
| No jank | 60fps, no stuttering | [ ] |
| Reduced motion | Respects `prefers-reduced-motion` | [ ] |

### Hover States

| Check | Expected | Pass |
|-------|----------|------|
| All clickable elements | Cursor changes to pointer | [ ] |
| Buttons | Color/shadow change | [ ] |
| Links | Color change or underline | [ ] |
| Cards | Subtle elevation change | [ ] |

### Focus States (Keyboard Nav)

| Check | Expected | Pass |
|-------|----------|------|
| Tab order | Logical, left-to-right, top-to-bottom | [ ] |
| Focus visible | Clear ring on focused element | [ ] |
| Skip links | (Optional) Skip to main content | [ ] |

### Loading States

| Check | Expected | Pass |
|-------|----------|------|
| Initial page load | Skeleton or spinner | [ ] |
| Form submission | Button shows loading | [ ] |
| Data fetching | Loading indicator visible | [ ] |

### Error States

| Check | Expected | Pass |
|-------|----------|------|
| Form validation | Inline errors, clear message | [ ] |
| API errors | Toast or banner notification | [ ] |
| Empty states | Helpful message + action | [ ] |
| 404 | Friendly not-found page | [ ] |

---

## 5. Responsive Behavior

Test at these breakpoints:

| Breakpoint | Width | Device |
|------------|-------|--------|
| Mobile | 375px | iPhone SE |
| Tablet | 768px | iPad Mini |
| Desktop | 1280px | Laptop |
| Wide | 1536px | External monitor |

### Checks at Each Breakpoint

| Check | Expected | Pass |
|-------|----------|------|
| No horizontal scroll | Content fits viewport | [ ] |
| Text readable | No text too small (min 14px) | [ ] |
| Touch targets | Min 44px on mobile | [ ] |
| Images | Scale appropriately, no distortion | [ ] |
| Navigation | Appropriate for screen size | [ ] |
| Forms | Usable, inputs not cramped | [ ] |

---

## 6. Accessibility Quick Checks

| Check | Expected | Pass |
|-------|----------|------|
| Color contrast | Text readable on backgrounds | [ ] |
| Alt text | Images have descriptive alt | [ ] |
| Form labels | All inputs have labels | [ ] |
| Heading hierarchy | h1 > h2 > h3, no skips | [ ] |
| Keyboard navigation | All features accessible | [ ] |
| Focus indicators | Visible on focus | [ ] |

---

## 7. Browser Testing

Test in at least 2 browsers:

| Browser | Version | Pass |
|---------|---------|------|
| Chrome | Latest | [ ] |
| Firefox | Latest | [ ] |
| Safari | Latest (if Mac) | [ ] |
| Edge | Latest | [ ] |

---

## Sign-off

```
PR: #_______
Reviewer: _______________
Date: _______________

Notes:
_________________________________
_________________________________
_________________________________

Result: [ ] APPROVED  [ ] CHANGES REQUESTED
```

---

## Reference

- **Design tokens**: `frontend/tailwind.config.js`
- **UI reference image**: `ideation/library UI.webp`
- **Component source**: `frontend/src/components/`
