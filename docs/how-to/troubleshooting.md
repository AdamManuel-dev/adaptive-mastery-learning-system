# Troubleshooting

Solutions for common issues in the Adaptive Mastery Learning System.

---

## No cards due - what to do

**Symptom:** Review page shows "No Cards Due for Review"

**Possible causes and solutions:**

1. **All cards reviewed recently**
   - Spaced repetition schedules cards into the future
   - Check back later when cards become due
   - View Dashboard to see next due date

2. **No concepts created**
   - Go to Concepts page
   - Create at least one concept
   - Add variants to generate reviewable cards

3. **No variants exist**
   - Concepts need variants to generate cards
   - Create variants via API (see [Working with Variants](./working-with-variants.md))

4. **Schedule data corrupted**
   - Check database integrity:
     ```bash
     sqlite3 data/learning.db "PRAGMA integrity_check;"
     ```
   - Verify schedule table has entries:
     ```bash
     sqlite3 data/learning.db "SELECT COUNT(*) FROM schedule;"
     ```

---

## LLM generation failing

**Symptom:** Card generation requests fail or return errors

**Check these items:**

1. **API key invalid**
   - Go to Settings > LLM Configuration
   - Verify API key is entered correctly
   - Test with "Test Connection" button

2. **Provider not responding**
   - Check your internet connection
   - Verify provider status (OpenAI, Anthropic status pages)
   - Try a different model name

3. **Rate limit exceeded**
   - Wait a few minutes before retrying
   - Check provider dashboard for usage limits

4. **Model name incorrect**
   - Common model names:
     - OpenAI: `gpt-4`, `gpt-3.5-turbo`
     - Anthropic: `claude-3-opus`, `claude-3-sonnet`
   - Check provider documentation for current model names

5. **Local model not running**
   - If using local provider, ensure model server is active
   - Check base URL configuration in Settings

---

## Database migration errors

**Symptom:** App fails to start with database errors

**Solutions:**

1. **First-time setup**
   - The database is created automatically on first run
   - Ensure write permissions on the `data/` directory

2. **Corrupted database**
   - Back up current database:
     ```bash
     cp data/learning.db data/learning.db.backup
     ```
   - Delete and let app recreate:
     ```bash
     rm data/learning.db
     ```
   - Restart the application

3. **Schema version mismatch**
   - Check migration logs in console
   - The app auto-runs migrations on startup
   - If stuck, delete database and restart

4. **Permissions issue**
   - Verify file permissions:
     ```bash
     ls -la data/
     ```
   - Fix permissions if needed:
     ```bash
     chmod 644 data/learning.db
     ```

---

## Performance issues

**Symptom:** App is slow or unresponsive

**Optimizations:**

1. **Large concept library**
   - SQLite handles thousands of concepts well
   - Consider archiving unused concepts
   - Check for excessive variants per concept

2. **Memory usage high**
   - Restart the application
   - Close other Electron apps
   - Check available system RAM

3. **Slow card loading**
   - The query uses indexes by default
   - Rebuild indexes if needed:
     ```bash
     sqlite3 data/learning.db "REINDEX;"
     ```

4. **UI stuttering**
   - Disable animations if available in Settings
   - Check for background processes
   - Update to latest Electron version

---

## API not available errors

**Symptom:** "API not available" message in console

**Causes:**

1. **Preload script failed**
   - Check console for preload errors
   - Verify Electron contextBridge is working
   - Restart the application

2. **Context isolation issue**
   - This is a development/build configuration issue
   - Ensure `contextIsolation: true` in main process

---

## Review ratings not saving

**Symptom:** Ratings submitted but mastery doesn't update

**Check:**

1. **Network/IPC error**
   - Check console for error messages
   - The submit should return `ReviewResultDTO`

2. **Database write failed**
   - Check database permissions
   - Verify disk space available

3. **Event logging issue**
   - Events table should have new entries:
     ```bash
     sqlite3 data/learning.db "SELECT * FROM events ORDER BY created_at DESC LIMIT 5;"
     ```

---

## Cards repeating too frequently

**Symptom:** Same cards appearing despite good ratings

**Explanations:**

1. **Limited card pool**
   - With few variants, cards cycle faster
   - Add more variants to concepts

2. **Rating "Again" frequently**
   - "Again" resets interval to minimum
   - Use "Hard" for partial recall instead

3. **Anti-frustration inserting confidence builders**
   - After failures, easier cards are inserted
   - This is expected behavior

---

## Data backup and recovery

**Goal:** Protect your learning data

**Backup process:**

```bash
# Create timestamped backup
cp data/learning.db "data/learning-$(date +%Y%m%d).db.backup"
```

**Restore process:**

```bash
# Stop the application first
cp data/learning-YYYYMMDD.db.backup data/learning.db
```

**Automated backup (macOS/Linux):**

```bash
# Add to crontab for daily backup
0 2 * * * cp /path/to/data/learning.db "/path/to/backups/learning-$(date +%Y%m%d).db"
```

---

## Getting help

If these solutions don't resolve your issue:

1. Check the [GitHub Issues](https://github.com/yourusername/flashcards/issues) for similar problems
2. Gather diagnostic info:
   - Console error messages
   - Database integrity check results
   - Steps to reproduce
3. Open a new issue with the above information

---

## Related

- [Reference: Database Schema](../reference/database-schema.md) - Table structures
- [Reference: IPC Channels](../reference/ipc-api.md) - API specification
