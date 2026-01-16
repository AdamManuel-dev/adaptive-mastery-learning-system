# Technology Choices Explanation: Why This Stack

**Understanding the reasoning behind each technology decision**

---

## The Local-First Philosophy

Before examining individual technology choices, it is important to understand the overarching philosophy: **local-first**.

The Adaptive Mastery Learning System is designed to work entirely on the user's machine without requiring internet connectivity (except for optional LLM features). This philosophy drove many technology decisions and rejected many others.

### Why Local-First?

**Privacy**

Learning data is deeply personal. What you are studying, what you struggle with, how fast you learn - this information reveals intellectual vulnerabilities. Keeping it local means:
- No data on company servers
- No risk of breaches exposing study habits
- No terms of service to read or agree to

**Reliability**

Cloud services fail, companies shut down, APIs change. A local-first application:
- Works offline
- Survives company pivots
- Never loses data to service discontinuation

**Speed**

Network latency adds perceivable delay to every interaction. Local storage:
- Provides instant response
- Enables sophisticated algorithms without API calls
- Supports rapid review sessions without waiting

**Ownership**

Users own their data completely. They can:
- Back it up as they see fit
- Export it to other tools
- Modify the database directly if needed

---

## Electron: The Desktop Framework

### Why Desktop at All?

We could have built a web application. Why choose desktop?

**True Local Storage**

Web applications can store data locally (IndexedDB, localStorage), but:
- Browser storage can be cleared unexpectedly
- Storage limits vary by browser
- Users do not think of browser data as "their data"

Desktop applications with local databases feel more like "real" software that respects user data.

**System Integration**

Desktop applications can:
- Run in the background
- Send system notifications
- Access the file system for import/export
- Integrate with other desktop tools

**Offline-First is Natural**

Desktop applications are obviously offline-capable. Users understand that their desktop software works without internet.

### Why Electron Specifically?

**Cross-Platform from One Codebase**

Electron applications run on Windows, macOS, and Linux from a single codebase. Alternatives:

| Option | Trade-offs |
|--------|------------|
| Native apps | 3x development cost, best performance |
| Tauri | Smaller bundle, less mature ecosystem |
| Flutter | Mobile-focused, desktop support newer |
| Qt/wxWidgets | C++ complexity, older paradigm |

Electron's maturity and ecosystem made it the pragmatic choice for a solo developer or small team.

**Web Technology Familiarity**

React developers can contribute immediately. The renderer process is just a web app. This expands the potential contributor pool.

**Proven at Scale**

VS Code, Slack, Discord, Figma desktop, and countless other applications prove Electron can produce quality software. The criticism of "Chrome wrapper" is technically accurate but practically irrelevant for many use cases.

### Electron Trade-offs

**Bundle Size**

Electron applications include Chromium, resulting in 100+ MB downloads. For a learning application that users will use daily for months or years, this initial download cost is acceptable.

**Memory Usage**

Chromium is not memory-efficient. The application typically uses 200-400 MB of RAM. This is noticeable but not problematic on modern machines with 8+ GB RAM.

**Startup Time**

Electron applications take 2-5 seconds to start. For a tool used in focused study sessions (not quick lookups), this is acceptable.

### Future Considerations

**Tauri Migration**

Tauri offers similar capabilities with much smaller bundles by using the system webview. When Tauri's ecosystem matures further, migration could reduce bundle size by 90%. The hexagonal architecture would make this migration manageable.

**Web Version**

The domain layer could be shared with a web version for users who prefer browser access. The infrastructure layer would need web-specific implementations (IndexedDB, etc.).

---

## SQLite: The Database

### Why SQLite?

SQLite is unusual: it is a database engine that runs as a library, not a server. This makes it perfect for local-first applications.

**Zero Configuration**

No database server to install, configure, or maintain. The database is a single file that the application manages.

**Reliable**

SQLite is one of the most tested software systems ever created. It is used in aircraft systems, phone operating systems, and billions of devices. Corruption is essentially impossible under normal operation.

**Fast**

Without network overhead, SQLite is extremely fast for local operations. The Adaptive Mastery Learning System's queries (selecting due cards, updating mastery) complete in milliseconds.

**Portable**

The entire database is a single file. Users can:
- Back it up by copying one file
- Move it to another machine
- Inspect it with standard SQLite tools

### Why better-sqlite3 Specifically?

Node.js has several SQLite bindings. better-sqlite3 was chosen because:

**Synchronous API**

better-sqlite3 provides synchronous operations:

```typescript
const row = db.prepare('SELECT * FROM concepts WHERE id = ?').get(id)
```

While asynchronous APIs are generally preferred in Node.js, synchronous SQLite operations have advantages:
- Simpler code without callback/promise chains
- Faster for sequential operations (no async overhead)
- SQLite is inherently single-threaded anyway

The application layer wraps these in Promises to maintain async interfaces for future flexibility.

**Performance**

better-sqlite3 is significantly faster than alternatives:
- 2-5x faster than node-sqlite3 for typical operations
- Pre-compiled statements are kept ready
- Minimal binding overhead

**TypeScript Support**

First-class TypeScript definitions provide type safety for database operations.

### SQLite Alternatives Considered

**IndexedDB**

Browser-native storage. Rejected because:
- Electron renderer process is less stable for critical data
- More complex API
- Not portable between environments

**LevelDB**

Key-value store from Google. Rejected because:
- SQL queries are more natural for the data model
- Weaker tooling ecosystem
- Less portable

**PostgreSQL/MySQL**

Server-based databases. Rejected because:
- Requires server installation
- Overkill for single-user data volumes
- Contradicts local-first philosophy

---

## React 19: The UI Framework

### Why React?

React dominates modern frontend development for good reasons:

**Component Model**

The component model maps naturally to UI structure. Card components, dashboard charts, review screens - each becomes a self-contained piece.

**Ecosystem**

The React ecosystem provides solutions for almost every UI need:
- Routing (React Router)
- Form handling
- Animation
- Testing

**Hiring/Contributing**

React skills are common. Future contributors can be productive quickly.

### Why React 19?

React 19 adds features relevant to the application:

**Improved Suspense**

Better data loading patterns for review sessions.

**Actions**

Built-in form handling for concept creation/editing.

**Use Hook**

Cleaner async resource handling.

### React Alternatives Considered

**Vue 3**

Excellent framework with better TypeScript integration than React historically. Rejected because:
- Smaller ecosystem
- React is more common (contributor access)
- Personal preference/familiarity

**Svelte**

Innovative compiler-based approach with excellent performance. Rejected because:
- Smaller ecosystem
- Less mature TypeScript support at decision time
- Fewer experienced developers

**Solid.js**

React-like with better performance through fine-grained reactivity. Rejected because:
- Very new ecosystem
- Migration path unclear
- Risk of early-adopter issues

---

## Jotai: State Management

### Why Jotai?

State management is one of the most debated aspects of React development. Jotai was chosen for its simplicity and atomic model.

**Minimal Boilerplate**

Compare a simple counter:

Redux:
```typescript
// action types, action creators, reducer, selector, mapDispatchToProps...
```

Jotai:
```typescript
const countAtom = atom(0)
const [count, setCount] = useAtom(countAtom)
```

For a personal project, this simplicity matters.

**Atomic Model**

Jotai's atomic model matches how the application thinks about state:
- Current card atom
- Mastery profile atom
- Review session atom

Each piece of state is independent, updated independently, and subscribed to independently.

**Derived State**

Atoms can derive from other atoms:

```typescript
const weakestDimensionAtom = atom((get) => {
  const profile = get(masteryProfileAtom)
  // calculation...
})
```

This handles common patterns without extra abstraction.

**TypeScript Native**

Jotai was built with TypeScript from the start. Types flow naturally through atoms and derived state.

### Jotai vs Alternatives

**Redux**

The industry standard. Rejected because:
- Too much boilerplate for a personal project
- DevTools are nice but not critical
- Time-travel debugging rarely needed

Redux would be a reasonable choice for a larger team.

**Zustand**

Similar simplicity to Jotai with a different mental model. Either would work. Jotai's atomic model felt more natural for this application.

**MobX**

Powerful but adds complexity with observables and decorators. Overkill for the data complexity here.

**React Query/TanStack Query**

Excellent for server state but unnecessary for local-first application. All state is local; there is no server to query.

---

## MUI + Tailwind: The Styling Approach

### Why Both?

Using both MUI and Tailwind might seem redundant, but they serve complementary purposes.

**MUI for Complex Components**

Material UI provides battle-tested implementations of complex UI patterns:
- Dialogs with accessibility
- Form controls with validation
- Tables with sorting/pagination
- Autocomplete with keyboard navigation

Building these from scratch would take months and likely have accessibility issues.

**Tailwind for Layout and Custom Styling**

Tailwind excels at:
- Layout (flex, grid, spacing)
- Custom visual styling
- Responsive design
- Quick adjustments

Writing `className="flex gap-4 p-6"` is faster than creating styled-components for every layout.

### The Integration Pattern

```tsx
<Card className="p-6 hover:shadow-lg transition-shadow">
  <CardContent className="flex flex-col gap-4">
    <Typography variant="h5" className="text-gray-900 dark:text-white">
      Title
    </Typography>
    <div className="flex gap-2">
      <Button variant="contained">Primary</Button>
      <Button variant="outlined">Secondary</Button>
    </div>
  </CardContent>
</Card>
```

MUI components provide structure and complex behavior. Tailwind handles layout and visual tweaks.

### Theme Alignment

MUI's theme system is configured to match Tailwind's color palette:

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#3b82f6' },    // Tailwind blue-500
    secondary: { main: '#8b5cf6' },  // Tailwind violet-500
  },
})
```

This ensures visual consistency regardless of which system provides a particular style.

### Alternatives Considered

**MUI Only**

Possible but limiting. MUI's styling system (sx prop, styled) is verbose for simple layout. Tailwind's utility classes are faster for common patterns.

**Tailwind Only**

Would require building complex components (dialogs, form controls, autocomplete) from scratch. Not worth the time investment.

**Chakra UI**

Excellent component library with built-in styling. Could replace MUI + Tailwind. Chose MUI for its longer track record and larger ecosystem.

**CSS Modules**

Traditional approach with scoped styles. Works but slower than Tailwind for iteration.

---

## TypeScript: The Language

### Why TypeScript?

TypeScript adds static typing to JavaScript. For this project, the benefits are substantial:

**Domain Model Safety**

The domain model relies heavily on value objects and entities with specific constraints. TypeScript ensures:
- Dimensions are valid dimension types
- Difficulty is 1-5, not arbitrary numbers
- Review results are one of four options

Without types, these constraints would require runtime checks scattered throughout the code.

**Refactoring Confidence**

When renaming a property or changing a function signature, TypeScript shows every affected location. This enables aggressive refactoring that would be terrifying in JavaScript.

**Documentation**

Types serve as documentation. When a function declares `selectVariantForConcept(variants: Variant[], mastery: MasteryProfile): Variant`, the signature tells you what it does.

**IDE Support**

Autocomplete, jump-to-definition, and inline documentation all depend on type information. TypeScript makes these features reliable.

### Strict Mode

The project uses TypeScript's strict mode, which enables:
- `strictNullChecks`: Catches null/undefined errors
- `noImplicitAny`: Requires explicit types
- `strictFunctionTypes`: Catches parameter type mismatches

Strict mode catches bugs that would otherwise surface at runtime.

---

## Build Tooling: electron-vite

### Why Vite?

Vite has become the default choice for modern frontend tooling because:

**Fast Development**

Vite uses native ES modules in development, eliminating bundling. Changes appear instantly rather than waiting for Webpack to rebuild.

**Simple Configuration**

Vite requires minimal configuration for typical setups. Convention over configuration.

**Optimized Production**

Production builds use Rollup for optimal bundle sizes and code splitting.

### Why electron-vite Specifically?

electron-vite extends Vite for Electron's multi-process architecture:
- Main process bundling
- Renderer process with HMR
- Preload script handling
- Development server with Electron integration

Alternatives like electron-forge or electron-builder are possible but require more configuration for the same result.

---

## Summary of Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Electron | Cross-platform, web tech | Bundle size, memory |
| SQLite | Reliable, portable | Single-user only |
| React | Ecosystem, familiarity | Learning curve, complexity |
| Jotai | Simple, atomic | Less mature than Redux |
| MUI | Complex components | Bundle size, opinion |
| Tailwind | Fast iteration | HTML class verbosity |
| TypeScript | Safety, refactoring | Build complexity, learning |

Each choice involves trade-offs. The selected stack optimizes for:
- Developer productivity
- Code maintainability
- User privacy (local-first)
- Long-term viability

---

## Evolution Path

The technology choices support evolution:

**Web Version**

Share domain layer, create web-specific infrastructure (IndexedDB, fetch).

**Mobile Apps**

React Native could share significant UI code. Domain layer is already platform-independent.

**Cloud Sync (Optional)**

Add sync infrastructure without changing domain logic. Repository pattern makes this clean.

**Alternative Databases**

Repository interfaces could support PostgreSQL for power users or IndexedDB for web.

The hexagonal architecture and DDD patterns ensure that technology changes affect only the relevant layer.

---

*See also: [Architecture](./architecture.md) for how the technology stack fits into the overall system design.*
