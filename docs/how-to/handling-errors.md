# Handling Errors Gracefully

Task-oriented guide for understanding and recovering from errors in the application.

---

## Recover from page errors

**Goal:** Get back to a working state after an error occurs.

When a page error occurs, the application displays an error boundary with recovery options:

1. You will see a message: "Something went wrong"
2. The specific error message is displayed below
3. Click the **Try again** button to attempt recovery
4. If the error persists, try navigating to a different page

**Common recovery steps:**

1. Click **Try again** - resets the component and attempts to re-render
2. Navigate to **Dashboard** - a known working page
3. Refresh the browser/app - full application reset
4. Check the console for detailed error information

---

## Understand error notifications

**Goal:** Know what different notification types mean.

The application uses color-coded toast notifications:

| Color | Type | Meaning |
|-------|------|---------|
| Green | Success | Operation completed successfully |
| Red | Error | Operation failed, action may be needed |
| Blue | Info | General information or status update |

**Error notifications** require attention and may need you to:
- Retry the operation
- Check your input
- Verify settings (e.g., API key)

---

## Handle API key errors

**Goal:** Fix errors related to LLM configuration.

If you see errors when generating cards with LLM:

1. Navigate to **Settings** page
2. Check the **LLM Configuration** section
3. Verify your API key is entered correctly
4. Select the correct provider (OpenAI, Anthropic, or Local)
5. Click **Save Settings**
6. Try the operation again

**Common API key issues:**

- Key is empty or only contains placeholder text
- Key is for wrong provider (e.g., OpenAI key with Anthropic selected)
- Key has expired or been revoked
- Rate limits exceeded on your account

---

## Handle database errors

**Goal:** Recover from data storage issues.

If you see database-related errors:

**Step 1: Check database integrity**

```bash
sqlite3 data/learning.db "PRAGMA integrity_check;"
```

Expected output: `ok`

**Step 2: If integrity check fails**

1. Stop the application
2. Back up the current database:
   ```bash
   cp data/learning.db data/learning.db.backup
   ```
3. Delete the corrupted database:
   ```bash
   rm data/learning.db
   ```
4. Restart the application (a new database will be created)

**Note:** Deleting the database removes all learning data. Only do this if backup/recovery is impossible.

---

## Handle "API not available" errors

**Goal:** Fix communication issues between app components.

This error indicates the Electron IPC bridge failed to initialize:

1. Stop the development server (Ctrl+C)
2. Delete the build output:
   ```bash
   rm -rf out/
   ```
3. Restart the application:
   ```bash
   npm run dev
   ```

If the error persists:
- Check for Node.js version compatibility (requires 18+)
- Reinstall dependencies: `npm ci`
- Check console for detailed error messages

---

## Report persistent errors

**Goal:** Get help for errors that cannot be resolved.

If an error persists after trying recovery steps:

1. **Gather information:**
   - Screenshot of the error message
   - Steps to reproduce the error
   - Console output (open DevTools with Cmd/Ctrl+Shift+I)
   - Application version

2. **Check existing issues:**
   - Search the GitHub repository issues
   - Look for similar error messages

3. **Report the issue:**
   - Open a new GitHub issue
   - Include all gathered information
   - Describe what you were trying to do

---

## Prevent common errors

**Goal:** Avoid errors before they happen.

**Best practices:**

1. **Save settings after changes** - Click "Save Settings" before leaving the Settings page
2. **Wait for operations to complete** - Do not navigate away during save operations
3. **Keep API keys secure** - Do not share or expose your API keys
4. **Regular backups** - Copy your `data/learning.db` file periodically
5. **Update regularly** - Keep the application updated for bug fixes

---

## Related

- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Reference: Error Boundary](../reference/accessibility.md#error-boundary) - Error handling specifications
- [Reference: Toast Notifications](../reference/accessibility.md#toast-notifications) - Notification system details
