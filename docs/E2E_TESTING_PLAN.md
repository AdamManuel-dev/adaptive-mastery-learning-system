# Document Includes

- 4 implementation phases with time estimates (~8 hours total)
- Directory structure for organizing tests
- Page Object Models for all 4 pages
- 40+ test scenarios across functional and visual testing
- 11 visual snapshots for desktop + mobile viewports
- NPM scripts for running tests
- Playwright configuration for Electron apps

When you're ready to implement, you can use the /playwright-skill to interactively explore the UI and generate test scripts.
---
# E2E Testing Plan with Playwright for FlashCards

## Summary

Comprehensive E2E testing using Playwright for the FlashCards Electron app with:
- **Full functional E2E tests** - Complete user flows (create concepts, run reviews, verify data)
- **Visual regression** - Playwright snapshots with baseline comparison
- **Viewports:** Desktop (1200x800) + Mobile (<768px)

---

## Application Overview

| Page | Route | Key Features to Test |
|------|-------|---------------------|
| Dashboard | `/` | Stats grid (4 cards), mastery bars, dimension breakdown, action buttons |
| Review | `/review` | Card display, show/hide answer, rating buttons (Again/Hard/Good/Easy), keyboard shortcuts |
| Concepts | `/concepts` | CRUD operations, search filtering, modal forms, facts array input |
| Settings | `/settings` | LLM provider config, theme toggle (Light/Dark/System), save functionality |

---

## Implementation Phases

### Phase 1: Infrastructure Setup (~1 hour)

**Install Dependencies:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Directory Structure:**
```
e2e/
├── fixtures/
│   ├── electron.fixture.ts      # Electron app launcher
│   ├── test-data.fixture.ts     # Database seeding
│   └── api-mock.fixture.ts      # IPC mocking utilities
├── pages/                       # Page Object Models
│   ├── base.page.ts            # Common navigation methods
│   ├── dashboard.page.ts
│   ├── review.page.ts
│   ├── concepts.page.ts
│   └── settings.page.ts
├── specs/
│   ├── dashboard/
│   │   ├── dashboard.spec.ts
│   │   └── dashboard.visual.spec.ts
│   ├── review/
│   │   ├── review.spec.ts
│   │   └── review.visual.spec.ts
│   ├── concepts/
│   │   ├── concepts-crud.spec.ts
│   │   └── concepts.visual.spec.ts
│   ├── settings/
│   │   ├── settings.spec.ts
│   │   └── settings.visual.spec.ts
│   └── navigation/
│       └── navigation.spec.ts
├── utils/
│   └── snapshot-helpers.ts
└── __snapshots__/
    ├── desktop/
    └── mobile/
```

**Playwright Configuration (`playwright.config.ts`):**
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  fullyParallel: false,
  workers: 1, // Single worker for Electron
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1200, height: 800 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 667 } },
    },
  ],
})
```

---

### Phase 2: Page Object Models (~2 hours)

| Page Object | Key Methods |
|------------|-------------|
| `BasePage` | `navigateTo()`, `waitForPageReady()`, `isMobileViewport()` |
| `DashboardPage` | `getCardsDueCount()`, `getDimensionScores()`, `startReviewSession()` |
| `ConceptsPage` | `createConcept()`, `editConcept()`, `deleteConcept()`, `searchConcepts()` |
| `ReviewPage` | `showAnswer()`, `rateCard()`, `completeReview()`, `useKeyboardShortcut()` |
| `SettingsPage` | `setLLMProvider()`, `selectTheme()`, `saveSettings()` |

**Example: ConceptsPage**
```typescript
export class ConceptsPage extends BasePage {
  readonly addConceptButton: Locator
  readonly searchInput: Locator
  readonly conceptCards: Locator
  readonly modal: Locator
  readonly nameInput: Locator
  readonly definitionInput: Locator
  readonly addFactButton: Locator
  readonly submitButton: Locator

  async createConcept(name: string, definition?: string, facts?: string[]): Promise<void>
  async editConcept(conceptName: string): Promise<void>
  async deleteConcept(conceptName: string): Promise<void>
  async searchConcepts(query: string): Promise<void>
  async getConceptNames(): Promise<string[]>
}
```

---

### Phase 3: Functional Tests (~3 hours)

#### Dashboard Tests
- [ ] Stats cards display correctly (Cards Due, Total Concepts, Mastery %, Dimensions)
- [ ] Mastery progress bars render with correct percentages
- [ ] Dimension breakdown shows all 6 dimensions with color coding
- [ ] "Start Review" button navigates to `/review`
- [ ] "Add Concepts" link visible when no cards due

#### Concepts CRUD Tests
- [ ] Create concept with name only
- [ ] Create concept with name, definition, and facts
- [ ] Validate required name field
- [ ] Edit existing concept name
- [ ] Delete concept with confirmation dialog
- [ ] Search filters concepts correctly
- [ ] Clear search shows all concepts
- [ ] Empty state displays when no concepts
- [ ] No results message for unmatched search

#### Review Flow Tests
- [ ] Empty state when no cards due
- [ ] Card displays with question section
- [ ] "Show Answer" button reveals answer section
- [ ] Rating buttons visible after answer revealed
- [ ] Rating advances to next card
- [ ] Progress indicator updates after each review
- [ ] Keyboard shortcuts work (Space for answer, 1-4 for ratings)
- [ ] Exit review returns to dashboard

#### Settings Tests
- [ ] LLM provider dropdown shows options (OpenAI, Anthropic, Local)
- [ ] API key input is masked (password type)
- [ ] Cards per session has valid range (5-100)
- [ ] Theme buttons toggle correctly
- [ ] Save shows success message

#### Navigation Tests
- [ ] All routes accessible from nav links
- [ ] Active nav link highlighted
- [ ] Logo visible in header
- [ ] Deep linking works for all routes

---

### Phase 4: Visual Regression (~2 hours)

**Snapshots to Capture:**

| Page | State | Desktop | Mobile |
|------|-------|:-------:|:------:|
| Dashboard | With data (cards due) | ✓ | ✓ |
| Dashboard | Empty state | ✓ | ✓ |
| Dashboard | Loading spinner | ✓ | |
| Review | Question visible | ✓ | ✓ |
| Review | Answer revealed | ✓ | ✓ |
| Review | Empty (no cards due) | ✓ | ✓ |
| Concepts | Grid with cards | ✓ | ✓ |
| Concepts | Empty state | ✓ | ✓ |
| Concepts | Create modal | ✓ | ✓ |
| Concepts | No search results | ✓ | |
| Settings | Default state | ✓ | ✓ |

**Snapshot Configuration:**
- `maxDiffPixelRatio: 0.01`
- `threshold: 0.2`
- Mask dynamic content (timestamps, IDs, dates)

---

## NPM Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "test:e2e": "npm run build && playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:update-snapshots": "playwright test --update-snapshots",
    "test:e2e:desktop": "playwright test --project=desktop",
    "test:e2e:mobile": "playwright test --project=mobile"
  }
}
```

---

## Execution Order

1. **Setup** - Install Playwright, create config, create Electron fixture
2. **Page Objects** - Implement Base → Dashboard → Concepts → Review → Settings
3. **Navigation Tests** - Verify all routes work
4. **CRUD Tests** - Concepts page (most complex interactions)
5. **Review Tests** - Core user flow testing
6. **Visual Tests** - Generate baselines, implement snapshot tests
7. **CI Integration** - GitHub Actions workflow (optional)

---

## Running the Tests

```bash
# Run all E2E tests (builds app first)
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Update visual snapshots
npm run test:e2e:update-snapshots

# Run desktop viewport only
npm run test:e2e:desktop

# Run mobile viewport only
npm run test:e2e:mobile

# Run specific test file
npx playwright test e2e/specs/concepts/concepts-crud.spec.ts

# Generate HTML report
npx playwright show-report
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/renderer/pages/DashboardPage.tsx` | Stats display, mastery visualization |
| `src/renderer/pages/ReviewPage.tsx` | Card review flow, keyboard shortcuts |
| `src/renderer/pages/ConceptsPage.tsx` | CRUD operations, modal forms |
| `src/renderer/pages/SettingsPage.tsx` | Configuration UI |
| `src/renderer/components/layout/Layout.tsx` | Navigation header |
| `src/preload/index.ts` | IPC bridge (window.api) |
| `src/shared/types/ipc.ts` | DTO types for test fixtures |

---

## Design System Reference

**Colors (for visual validation):**
- Primary: `#3b82f6` (Blue)
- Success: `#22c55e` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

**Responsive Breakpoint:** `768px`

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Infrastructure Setup | 1 hour |
| Page Object Models | 2 hours |
| Functional Tests | 3 hours |
| Visual Regression | 2 hours |
| **Total** | **8 hours** |

---

## Next Steps

1. Run `/playwright-skill` to interactively explore the UI
2. Install Playwright dependencies
3. Create the Electron fixture for launching the app
4. Implement Page Object Models
5. Write test specifications
6. Generate visual baselines
