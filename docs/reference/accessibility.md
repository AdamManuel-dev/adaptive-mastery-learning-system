# Accessibility Reference

Technical specifications for accessibility features in the Adaptive Mastery Learning System.

---

## Overview

| Property | Value |
|----------|-------|
| Standard | WCAG 2.1 Level AA |
| Keyboard Support | Full |
| Screen Reader Support | ARIA landmarks and live regions |
| Focus Management | Visible focus indicators, focus traps |
| Color Independence | Text labels accompany color indicators |

---

## Keyboard Navigation

### Global Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Tab` | Move focus forward | All pages |
| `Shift + Tab` | Move focus backward | All pages |
| `Enter` | Activate focused element | Buttons, links |
| `Escape` | Close modal/dismiss notification | Modals, toasts |

### Review Page Shortcuts

| Key | Action | When Available |
|-----|--------|----------------|
| `Space` | Show answer | Question visible |
| `1` | Rate "Again" (0.0) | Answer revealed |
| `2` | Rate "Hard" (0.4) | Answer revealed |
| `3` | Rate "Good" (0.7) | Answer revealed |
| `4` | Rate "Easy" (1.0) | Answer revealed |

### Implementation

```typescript
// Keyboard event handling in ReviewPage
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ' && !answerRevealed) {
      event.preventDefault()
      revealAnswer()
    }
    if (answerRevealed) {
      switch (event.key) {
        case '1': submitRating('again'); break
        case '2': submitRating('hard'); break
        case '3': submitRating('good'); break
        case '4': submitRating('easy'); break
      }
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [answerRevealed])
```

---

## Skip to Main Content

### Specification

| Property | Value |
|----------|-------|
| Element | `<a>` link |
| Visibility | Hidden until focused |
| Target | `#main-content` |
| Position | Fixed, top-left |

### Implementation

```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
<!-- ... navigation ... -->
<main id="main-content" tabindex="-1">
  <!-- page content -->
</main>
```

### CSS Pattern

```css
.skip-link {
  position: fixed;
  top: -100px;
  left: 0;
  z-index: 9999;
}

.skip-link:focus {
  top: 0;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
}
```

---

## Focus Management

### Focus Indicators

| State | Style |
|-------|-------|
| Default focus | 2px solid outline, primary color |
| Focus-visible | Same as default (keyboard only) |
| Active | Slight scale or color change |

### Focus Traps

Modals implement focus trapping to prevent focus escaping:

```typescript
// Focus trap implementation
useEffect(() => {
  if (!isOpen) return

  const focusableElements = modalRef.current?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements?.[0] as HTMLElement
  const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement

  const handleTab = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }

  firstElement?.focus()
  document.addEventListener('keydown', handleTab)
  return () => document.removeEventListener('keydown', handleTab)
}, [isOpen])
```

---

## Toast Notifications

### ToastProvider API

| Export | Type | Description |
|--------|------|-------------|
| `ToastProvider` | Component | Context provider for notifications |
| `useToast` | Hook | Access toast functions |
| `ToastVariant` | Type | `'success' \| 'error' \| 'info'` |

### useToast Hook

```typescript
interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
  hideToast: (id: string) => void
}

const { showToast } = useToast()
showToast('Settings saved successfully', 'success')
```

### Toast Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `message` | `string` | Required | Notification text |
| `variant` | `ToastVariant` | `'info'` | Visual style |
| `duration` | `number` | `3000` | Auto-dismiss time (ms) |

### Accessibility Features

| Feature | Implementation |
|---------|---------------|
| ARIA live region | `aria-live="polite"` for info/success, `aria-live="assertive"` for error |
| Role | `role="status"` for info/success, `role="alertdialog"` for error |
| Focus management | Error toasts auto-focus close button |
| Keyboard dismiss | `Escape` key closes notification |
| Touch target | Close button 44x44 minimum size |

### CSS Classes

```css
.toast {
  /* Base toast styles */
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  min-width: 300px;
  max-width: 500px;
}

.toast.success { background: var(--color-success-bg); }
.toast.error { background: var(--color-error-bg); }
.toast.info { background: var(--color-info-bg); }

.toast.visible { transform: translateX(0); opacity: 1; }
.toast.exiting { transform: translateX(100%); opacity: 0; }
```

---

## Error Boundary

### Component API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Components to wrap |
| `fallback` | `(error, reset) => ReactNode` | Default UI | Custom fallback renderer |

### Usage

```tsx
// Default fallback
<ErrorBoundary>
  <PageContent />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary
  fallback={(error, resetError) => (
    <CustomErrorPage error={error} onRetry={resetError} />
  )}
>
  <PageContent />
</ErrorBoundary>
```

### Default Fallback UI

| Element | Accessibility |
|---------|---------------|
| Container | `role="alert"` |
| Error icon | `aria-hidden="true"` |
| Error message | Visible text |
| Retry button | Focusable, labeled |

### State Management

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// Reset method restores normal rendering
resetError = () => {
  this.setState({ hasError: false, error: null })
}
```

---

## ARIA Landmarks

### Page Structure

```html
<body>
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      <!-- sidebar navigation -->
    </nav>
  </header>

  <main id="main-content" role="main">
    <h1>Page Title</h1>
    <!-- page content -->
  </main>

  <div role="region" aria-label="Notifications" aria-live="polite">
    <!-- toast container -->
  </div>
</body>
```

### Navigation Labels

| Element | ARIA Label |
|---------|------------|
| Main nav | "Main navigation" |
| Toast container | "Notifications" |
| Modal dialogs | Dynamic based on content |

---

## Color and Contrast

### Color Independence

All color-coded information includes text labels:

| Visual | Text Label |
|--------|------------|
| Orange badge | "Needs Work" |
| Green badge | "Strongest" |
| Red notification | "Error: [message]" |
| Green notification | "Success: [message]" |

### Contrast Ratios

| Element | Ratio | Standard |
|---------|-------|----------|
| Body text | 4.5:1+ | AA compliant |
| Large text | 3:1+ | AA compliant |
| Focus indicators | 3:1+ | AA compliant |
| UI components | 3:1+ | AA compliant |

---

## Touch Targets

### Minimum Sizes

| Element | Size | Standard |
|---------|------|----------|
| Buttons | 44x44px | WCAG AAA |
| Close buttons | 44x44px | WCAG AAA |
| Navigation links | 44px height | WCAG AAA |
| Form inputs | 44px height | WCAG AAA |

---

## Screen Reader Announcements

### Live Regions

| Region | Politeness | Content |
|--------|------------|---------|
| Toast notifications | Polite/Assertive | Notification messages |
| Form validation | Assertive | Error messages |
| Progress updates | Polite | Review count changes |

### Dynamic Content

```tsx
// Announce review progress
<div aria-live="polite" aria-atomic="true">
  {reviewedCount} reviewed, {remainingCount} remaining
</div>
```

---

## Testing

### Manual Testing Checklist

- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators visible on all elements
- [ ] Escape closes modals and notifications
- [ ] Skip link works on all pages
- [ ] Review shortcuts work (Space, 1-4)
- [ ] Screen reader announces notifications
- [ ] Color-blind users can distinguish states

### Automated Testing

| Tool | Purpose |
|------|---------|
| axe-core | Accessibility violations |
| pa11y | Automated accessibility testing |
| Lighthouse | Accessibility audit |

---

## Related Documentation

- [How-To: Using Keyboard Shortcuts](../how-to/using-keyboard-shortcuts.md)
- [How-To: Handling Errors](../how-to/handling-errors.md)
- [How-To: Using Notifications](../how-to/using-notifications.md)
