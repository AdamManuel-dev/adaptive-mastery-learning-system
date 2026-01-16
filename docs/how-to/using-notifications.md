# Using Notifications

Task-oriented guide for understanding and interacting with toast notifications.

---

## Understand notification types

**Goal:** Know what different notifications mean.

The application displays three types of toast notifications:

| Type | Color | Icon | Purpose |
|------|-------|------|---------|
| Success | Green | Checkmark | Confirms successful operations |
| Error | Red | X | Alerts to failures requiring attention |
| Info | Blue | Info circle | Provides general information |

**Examples:**

- **Success:** "Settings saved successfully"
- **Error:** "Failed to save concept. Please try again."
- **Info:** "Review session completed. 15 cards reviewed."

---

## Dismiss notifications

**Goal:** Remove notifications from the screen.

Notifications can be dismissed in multiple ways:

1. **Wait** - Notifications auto-dismiss after 3 seconds
2. **Click X** - Click the close button on the right side
3. **Press Escape** - Keyboard shortcut to dismiss

**For error notifications:** Focus automatically moves to the close button for keyboard accessibility.

---

## Respond to error notifications

**Goal:** Take appropriate action when errors occur.

When you see a red error notification:

1. **Read the message** - It describes what went wrong
2. **Retry the action** - Many errors are transient
3. **Check your input** - Validation errors may require corrections
4. **Check settings** - API errors often require configuration updates

**Common error scenarios:**

| Error Message | Likely Cause | Action |
|--------------|--------------|--------|
| "Failed to save" | Network or database issue | Retry the save operation |
| "Invalid input" | Form validation failed | Check required fields |
| "API error" | LLM configuration issue | Check Settings > LLM Configuration |

---

## Notification accessibility features

**Goal:** Use notifications with assistive technologies.

The notification system includes accessibility features:

- **ARIA live regions** - Screen readers announce new notifications
- **Error alerts** - Error notifications use `role="alertdialog"` for immediate attention
- **Keyboard navigation** - Tab to close button, Escape to dismiss
- **Focus management** - Error notifications auto-focus the close button
- **Touch targets** - Close button meets 44x44 minimum touch target size

---

## Multiple notifications

**Goal:** Handle multiple notifications at once.

When multiple notifications appear:

1. Notifications stack vertically in the bottom-right corner
2. Each notification has its own 3-second timer
3. Dismiss individual notifications or let them auto-dismiss
4. Most recent notification appears at the bottom

**Tip:** If many notifications appear quickly, you can press Escape multiple times to dismiss them sequentially.

---

## Notification timing

**Goal:** Understand notification behavior.

| Phase | Duration | Description |
|-------|----------|-------------|
| Enter | 300ms | Notification slides in from right |
| Display | 3 seconds | Notification is visible |
| Exit | 300ms | Notification fades out |

**Note:** The timer resets if you hover over the notification (future enhancement).

---

## Settings page confirmation

**Goal:** Confirm that settings were saved.

After clicking "Save Settings":

1. A success notification appears: "Settings saved successfully"
2. The notification confirms your changes were persisted
3. If no notification appears, the save may have failed

**If no confirmation appears:**

1. Check for error notifications
2. Verify network/database connectivity
3. Try saving again
4. Check console for error details

---

## Related

- [Handling Errors](./handling-errors.md) - Recovering from errors
- [Using Keyboard Shortcuts](./using-keyboard-shortcuts.md) - Keyboard navigation
- [Reference: Toast Notifications](../reference/accessibility.md#toast-notifications) - Technical specifications
