# Development Guide

## Running the Application

This application supports two development modes:

### 1. Electron Mode (Full App) - `npm run dev`

Runs the complete Electron application with native desktop features.

```bash
npm run dev
```

**Features:**
- ✅ Full Electron desktop app experience
- ✅ Native file system access
- ✅ Real SQLite database (better-sqlite3)
- ✅ Persistent data storage
- ✅ Native OS integration

**Best for:**
- Testing the complete application
- Working with database features
- Testing native integrations
- Final QA before release

### 2. Browser Mode (Web UI Only) - `npm run dev:web`

Runs just the React UI in your default web browser (Chrome, Firefox, etc.)

```bash
npm run dev:web
```

**Features:**
- ✅ Opens automatically in your default browser
- ✅ Fast hot module reload (HMR)
- ✅ Chrome DevTools for debugging
- ✅ Mock API with localStorage persistence
- ✅ Faster iteration for UI development

**Best for:**
- UI/UX development and styling
- Component development
- React debugging with Chrome DevTools
- Quick iterations without Electron overhead

**Limitations:**
- ⚠️ Uses mock data (resets on localStorage clear)
- ⚠️ No real database operations
- ⚠️ No native desktop features

## Mock Data Persistence

When running in browser mode (`npm run dev:web`), the app uses a mock API with localStorage persistence:

- Data persists across browser refreshes
- Clear localStorage to reset mock data
- Check browser console for "🌐 Mock API initialized" message

## Port Information

Both modes serve the UI on: **http://localhost:5173/**

- **Electron mode**: Launches Electron window automatically
- **Browser mode**: Opens in default browser automatically

## TypeScript & Linting

```bash
# Type checking
npm run typecheck

# Lint with auto-fix
npm run lint:fix

# Format code
npm run format
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Troubleshooting

### "Electron uninstall" error

This means Electron is not properly installed. Fix with:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Browser mode not working

Make sure you're running the correct command:
```bash
npm run dev:web  # Not npm run dev
```

### Mock data issues

Clear browser localStorage:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### After updating dependencies

If you encounter issues after pulling new code:

1. **Clear and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **If mock API shows errors:** Clear browser cache and reload

3. **Check console for errors:** Open Chrome DevTools (F12) and check Console tab
