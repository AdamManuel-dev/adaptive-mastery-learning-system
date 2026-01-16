# Creating and Managing Concepts

Task-oriented guides for working with concepts in the Adaptive Mastery Learning System.

---

## Create a concept with facts

**Goal:** Add a new concept with name and definition.

1. Navigate to **Concepts** page
2. Click **Add Concept** button (top-right)
3. Fill in the form:
   - **Name** (required): The term or topic name
   - **Definition** (optional): Canonical definition for the concept
4. Click **Create**

The concept appears in your list immediately. Variants are created separately.

**Note:** Facts are stored as part of the definition field. Use line breaks or bullet formatting within the definition to separate distinct facts.

---

## Edit an existing concept

**Goal:** Update name or definition of a concept.

1. Navigate to **Concepts** page
2. Find the concept card
3. Click **Edit** on the card
4. Modify fields in the modal form
5. Click **Save**

Changes update immediately. Existing variants remain unchanged.

---

## Delete a concept

**Goal:** Remove a concept and all associated data.

1. Navigate to **Concepts** page
2. Find the concept card
3. Click **Delete** on the card
4. Confirm the deletion prompt

**Warning:** This deletes all variants, mastery history, and schedule data for the concept. This action cannot be undone.

---

## Search for concepts

**Goal:** Find specific concepts in a large collection.

1. Navigate to **Concepts** page
2. Use the search bar at the top
3. Type any part of the name or definition
4. Results filter in real-time

Clear the search field to show all concepts again.

---

## Import concepts from file

**Goal:** Bulk import concepts from external source.

> **Note:** File import is not yet implemented in the current version.

**Workaround:** Create concepts manually via the UI.

**Planned formats:**
- JSON array of `{ name, definition }` objects
- CSV with `name,definition` columns

See [Explanation: Data Model](../explanation/data-model.md) for the concept schema.

---

## Export concepts

**Goal:** Back up or share your concept library.

> **Note:** Export is not yet implemented in the current version.

**Workaround:** Access the SQLite database directly at `data/learning.db`.

```bash
# Export concepts table to JSON (requires sqlite3)
sqlite3 -json data/learning.db "SELECT * FROM concepts"
```

---

## Related

- [Working with Variants](./working-with-variants.md) - Add question cards to concepts
- [Tutorial: Getting Started](../tutorials/getting-started.md) - First-time setup
