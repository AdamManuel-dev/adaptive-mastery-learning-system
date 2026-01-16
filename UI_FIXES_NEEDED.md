# UI Fixes Needed - Adaptive Mastery Learning System

This document details all UI issues identified in the FlashCards application that need to be addressed before release.

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [Layout Component Issues](#layout-component-issues)
3. [Dashboard Page Issues](#dashboard-page-issues)
4. [Review Page Issues](#review-page-issues)
5. [Concepts Page Issues](#concepts-page-issues)
6. [Settings Page Issues](#settings-page-issues)
7. [VariantEditor Component Issues](#varianteditor-component-issues)
8. [Global CSS Issues](#global-css-issues)
9. [Accessibility Issues](#accessibility-issues)
10. [Responsive Design Issues](#responsive-design-issues)

---

## Critical Issues

### 1. Missing CSS Custom Property
**File:** `src/renderer/pages/DashboardPage.module.css` (line 198)
**Issue:** References `--space-3xl` which is not defined in `index.css`
**Impact:** Loading state may have incorrect padding
**Fix:** Add `--space-3xl: 4rem;` to the `:root` CSS custom properties in `index.css`, or change to existing `--space-2xl`

### 2. Router Compatibility Warning
**File:** `src/renderer/App.tsx`
**Issue:** Using `createBrowserRouter` in an Electron app. Browser history-based routing may cause issues with file:// protocol
**Impact:** Navigation may break or cause white screen on refresh
**Fix:** Consider using `createHashRouter` or `createMemoryRouter` instead for Electron compatibility

### 3. Unsafe Window API Access
**Files:** `DashboardPage.tsx`, `ReviewPage.tsx`, `ConceptsPage.tsx`, `VariantEditor.tsx`
**Issue:** Direct access to `window.api` without proper null checking in some places
**Impact:** Runtime errors if preload script fails
**Fix:** Add consistent null checks before all `window.api` calls, or create a wrapper hook

---

## Layout Component Issues

### 4. Text-Based Icons Instead of Proper Icons
**File:** `src/renderer/components/layout/Layout.tsx` (lines 28-31)
**Issue:** Navigation uses single-letter text icons ('D', 'R', 'C', 'S') instead of proper icon components
**Impact:** Poor visual appearance and accessibility
**Fix:** Replace with SVG icons or an icon library (e.g., Lucide, Heroicons)

```tsx
// Current (problematic)
{ to: '/', label: 'Dashboard', icon: 'D' }

// Recommended
{ to: '/', label: 'Dashboard', icon: <DashboardIcon /> }
```

### 5. Logo Icon Same Issue
**File:** `src/renderer/components/layout/Layout.tsx` (line 44)
**Issue:** Logo uses text "A" instead of a proper logo/icon
**Fix:** Replace with an actual logo SVG or icon component

---

## Dashboard Page Issues

### 6. Empty Activity Section Always Shows
**File:** `src/renderer/pages/DashboardPage.tsx` (lines 227-235)
**Issue:** "Recent Activity" section is hardcoded to always show "No recent activity" empty state
**Impact:** Feature appears broken/incomplete to users
**Fix:** Implement actual activity tracking or remove the section until it's functional

### 7. Missing Error Boundary
**File:** `src/renderer/pages/DashboardPage.tsx`
**Issue:** No error boundary to catch rendering errors
**Impact:** Entire page crashes if any component throws
**Fix:** Wrap in an ErrorBoundary component

### 8. Retry Button Uses window.location.reload()
**File:** `src/renderer/pages/DashboardPage.tsx` (line 100)
**Issue:** Using `window.location.reload()` for retry which is a poor UX
**Fix:** Implement a proper retry mechanism that re-fetches data

```tsx
// Current (problematic)
<button onClick={() => window.location.reload()}>Retry</button>

// Recommended
<button onClick={() => void fetchDashboardData()}>Retry</button>
```

### 9. Dimension Score Display May Exceed 100%
**File:** `src/renderer/pages/DashboardPage.tsx` (line 195)
**Issue:** `accuracyEwma * 100` could theoretically exceed 100 if data is invalid
**Fix:** Add Math.min(100, ...) clamping

---

## Review Page Issues

### 10. Potential Null Reference in Card Display
**File:** `src/renderer/pages/ReviewPage.tsx` (line 233)
**Issue:** Accessing `currentCard.concept.name` without null check after the hasCards check
**Impact:** Could crash if card structure changes
**Fix:** Add optional chaining or move null check closer to usage

### 11. Rating Classes May Be Empty Strings
**File:** `src/renderer/pages/ReviewPage.tsx` (line 62)
**Issue:** Using `styles.ratingAgain ?? ''` pattern suggests uncertainty about class existence
**Impact:** Styling may not apply correctly
**Fix:** Ensure all CSS classes are properly defined and remove the nullish coalescing

### 12. Keyboard Shortcut Hint Typography
**File:** `src/renderer/pages/ReviewPage.tsx` (line 261)
**Issue:** "(Space)" keyboard hint styling may not be visually distinct enough
**Fix:** Consider using `<kbd>` element with appropriate styling

### 13. Answer Section Animation Missing
**File:** `src/renderer/pages/ReviewPage.module.css`
**Issue:** Answer section appears abruptly without animation
**Fix:** Add fade-in or slide-down animation for answer reveal

---

## Concepts Page Issues

### 14. Text Search Icon
**File:** `src/renderer/pages/ConceptsPage.tsx` (line 302)
**Issue:** Search icon is just the letter "S" instead of a proper magnifying glass icon
**Fix:** Replace with proper SVG search icon

### 15. Empty State Icon Is Just "C"
**File:** `src/renderer/pages/ConceptsPage.tsx` (line 377)
**Issue:** Empty state uses letter "C" instead of a meaningful icon
**Fix:** Replace with a book, lightbulb, or plus icon

### 16. Modal Overlay Click Handler Has Accessibility Issues
**File:** `src/renderer/pages/ConceptsPage.tsx` (lines 415-421)
**Issue:** Modal overlay uses div with role="button" which is not ideal
**Fix:** Use a proper button or implement focus trap with better ARIA attributes

```tsx
// Current (problematic)
<div
  className={styles.modalOverlay}
  onClick={handleCloseForm}
  role="button"
  tabIndex={0}
>

// Recommended
<div
  className={styles.modalOverlay}
  onClick={handleCloseForm}
  role="presentation"
  aria-hidden="true"
>
```

### 17. Delete Confirmation Uses Native confirm()
**File:** `src/renderer/pages/ConceptsPage.tsx` (line 203)
**Issue:** Uses browser's native `confirm()` dialog which looks out of place in Electron
**Fix:** Implement custom confirmation modal component

### 18. Facts Management UX Could Be Improved
**File:** `src/renderer/pages/ConceptsPage.tsx`
**Issue:** Facts are managed with array indices, reordering not supported
**Fix:** Add drag-and-drop reordering for facts

---

## Settings Page Issues

### 19. Theme Toggle Doesn't Work
**File:** `src/renderer/pages/SettingsPage.tsx` (lines 215-217)
**Issue:** Field hint explicitly says "Theme switching is coming soon. Currently using light theme."
**Impact:** Users may try to change theme and think it's broken
**Fix:** Either implement theme switching or disable/hide the option with clearer messaging

### 20. Settings Not Persisted
**File:** `src/renderer/pages/SettingsPage.tsx` (lines 62-70)
**Issue:** handleSave is a placeholder with setTimeout, doesn't actually save via IPC
**Impact:** Settings are lost on reload
**Fix:** Implement actual settings persistence via `window.api.settings.set()`

### 21. Test Connection Button Does Nothing
**File:** `src/renderer/pages/SettingsPage.tsx` (lines 73-76)
**Issue:** handleTestConnection is an empty placeholder function
**Fix:** Implement actual API connection testing

### 22. Theme Icon Uses Letters
**File:** `src/renderer/pages/SettingsPage.tsx` (lines 243-249)
**Issue:** Theme icons are 'L', 'D', 'S' instead of sun/moon/computer icons
**Fix:** Replace with proper SVG icons

### 23. Settings Don't Load Saved Values
**File:** `src/renderer/pages/SettingsPage.tsx` (lines 42-49)
**Issue:** Initial state is hardcoded, doesn't load from storage
**Fix:** Add useEffect to load saved settings on mount

---

## VariantEditor Component Issues

### 24. Component Not Connected to Any Route
**File:** `src/renderer/components/VariantEditor.tsx`
**Issue:** Component exists but isn't accessible from anywhere in the UI
**Impact:** Users cannot create or edit variants
**Fix:** Add route or integrate into ConceptsPage detail view

### 25. Difficulty Slider Accessibility
**File:** `src/renderer/components/VariantEditor.tsx` (line 278-288)
**Issue:** Range input lacks aria-valuemin, aria-valuemax, aria-valuenow attributes
**Fix:** Add proper ARIA attributes for screen readers

---

## Global CSS Issues

### 26. Missing Focus Visible Styles
**File:** `src/renderer/styles/index.css`
**Issue:** Focus styles use box-shadow which may not be visible enough for keyboard users
**Fix:** Add `:focus-visible` styles with more prominent outline

### 27. Button Active State Too Subtle
**File:** `src/renderer/styles/index.css` (lines 149-151)
**Issue:** `transform: scale(0.98)` is barely noticeable
**Fix:** Add background color change or more visible feedback

### 28. No Dark Mode CSS Variables
**File:** `src/renderer/styles/index.css`
**Issue:** Only light mode colors defined in :root
**Fix:** Add media query for prefers-color-scheme: dark or class-based theme switching

---

## Accessibility Issues

### 29. Missing Skip Navigation Link
**File:** `src/renderer/components/layout/Layout.tsx`
**Issue:** No skip link for keyboard users to bypass navigation
**Fix:** Add visually hidden skip link at the start of the page

### 30. Form Labels Without Error Association
**Files:** Multiple page components
**Issue:** Form error messages aren't associated with inputs via aria-describedby
**Fix:** Add aria-describedby linking errors to their respective inputs

### 31. Loading States Not Announced
**Files:** `DashboardPage.tsx`, `ConceptsPage.tsx`, `ReviewPage.tsx`
**Issue:** Loading states don't use aria-live regions
**Fix:** Add `aria-live="polite"` to loading indicators

### 32. Modal Focus Trap Missing
**File:** `src/renderer/pages/ConceptsPage.tsx`
**Issue:** Modal doesn't trap focus, users can tab outside modal
**Fix:** Implement focus trap or use a library like @radix-ui/react-dialog

---

## Responsive Design Issues

### 33. Review Rating Grid on Mobile
**File:** `src/renderer/pages/ReviewPage.module.css` (lines 290-297)
**Issue:** Rating grid changes to 2x2 on mobile, hiding descriptions entirely
**Fix:** Consider vertical stack with descriptions or better touch targets

### 34. Settings Save Button Mobile Layout
**File:** `src/renderer/pages/SettingsPage.module.css` (lines 176-183)
**Issue:** Save section stacks vertically but button alignment may be off
**Fix:** Ensure save button is easily reachable (bottom of screen or sticky)

### 35. Minimum Touch Target Sizes
**Files:** Multiple CSS modules
**Issue:** Some buttons may be smaller than 44x44px minimum touch target
**Fix:** Audit and increase tap targets on mobile

---

## Summary

| Priority | Count | Categories |
|----------|-------|------------|
| Critical | 3 | Routing, CSS, API |
| High | 10 | Functionality, UX |
| Medium | 15 | Icons, Accessibility |
| Low | 7 | Polish, Responsive |

### Recommended Fix Order

1. **Router compatibility** - Prevents app from working correctly
2. **Settings persistence** - Core functionality broken
3. **VariantEditor integration** - Major feature not accessible
4. **Icon replacements** - Visual polish
5. **Accessibility improvements** - Required for inclusive design
6. **Theme implementation** - User expectation management
7. **Responsive refinements** - Polish for all screen sizes

---

*Generated by code analysis on January 16, 2026*
