# Database Schema Reference

Technical specifications for the SQLite database schema.

---

## Overview

| Property | Value |
|----------|-------|
| Database | SQLite |
| Library | better-sqlite3 |
| Storage | Local file (`./data/learning.db` default) |
| Encoding | UTF-8 |
| Foreign Keys | Enabled |

---

## Tables

### concepts

Stores learning concepts (aggregate roots).

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | TEXT | PRIMARY KEY | - | UUID identifier |
| `name` | TEXT | NOT NULL, UNIQUE | - | Concept name/term |
| `definition` | TEXT | NOT NULL | - | Canonical definition |
| `facts` | TEXT | NOT NULL | `'[]'` | JSON array of facts |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | ISO 8601 timestamp |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | ISO 8601 timestamp |

**Indexes:** None (primary key only)

**Notes:**
- `facts` stored as JSON array string
- Timestamps in ISO 8601 format
- `name` uniqueness enforced at database level

---

### variants

Stores card variants for testing concepts.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | TEXT | PRIMARY KEY | - | UUID identifier |
| `concept_id` | TEXT | NOT NULL, REFERENCES concepts(id) ON DELETE CASCADE | - | Parent concept |
| `dimension` | TEXT | NOT NULL | - | Cognitive dimension |
| `difficulty` | INTEGER | NOT NULL, CHECK (difficulty BETWEEN 1 AND 5) | - | Difficulty level 1-5 |
| `front` | TEXT | NOT NULL | - | Question/prompt |
| `back` | TEXT | NOT NULL | - | Answer/explanation |
| `hints` | TEXT | NOT NULL | `'[]'` | JSON array of hints |
| `last_shown_at` | TEXT | - | NULL | ISO 8601 timestamp |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | ISO 8601 timestamp |

**Indexes:**

| Name | Columns | Type |
|------|---------|------|
| `idx_variants_concept` | `concept_id` | B-tree |
| `idx_variants_dimension` | `dimension` | B-tree |

**Dimension Values:**
- `definition`
- `paraphrase`
- `example`
- `scenario`
- `discrimination`
- `cloze`

**Foreign Keys:**
- `concept_id` -> `concepts(id)` ON DELETE CASCADE

---

### mastery

Stores EWMA mastery tracking per dimension.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `dimension` | TEXT | PRIMARY KEY | - | Dimension type |
| `accuracy_ewma` | REAL | NOT NULL | `0.5` | Accuracy EWMA (0-1) |
| `speed_ewma` | REAL | NOT NULL | `0.5` | Speed EWMA (0-1) |
| `recent_count` | INTEGER | NOT NULL | `0` | Review count |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | ISO 8601 timestamp |

**Indexes:** None (primary key only)

**Notes:**
- One row per dimension (6 total rows)
- EWMA values range 0.0 to 1.0
- `recent_count` tracks reviews contributing to EWMA

---

### events

Stores review history for analytics.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | TEXT | PRIMARY KEY | - | UUID identifier |
| `concept_id` | TEXT | NOT NULL, REFERENCES concepts(id) ON DELETE CASCADE | - | Reviewed concept |
| `variant_id` | TEXT | NOT NULL, REFERENCES variants(id) ON DELETE CASCADE | - | Reviewed variant |
| `dimension` | TEXT | NOT NULL | - | Dimension tested |
| `difficulty` | INTEGER | NOT NULL | - | Variant difficulty |
| `result` | TEXT | NOT NULL, CHECK (result IN ('again', 'hard', 'good', 'easy')) | - | User rating |
| `time_ms` | INTEGER | NOT NULL | - | Response time (ms) |
| `hints_used` | INTEGER | NOT NULL | `0` | Hints revealed |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | ISO 8601 timestamp |

**Indexes:**

| Name | Columns | Type |
|------|---------|------|
| `idx_events_concept` | `concept_id` | B-tree |
| `idx_events_dimension` | `dimension` | B-tree |
| `idx_events_created` | `created_at` | B-tree |

**Result Values:**
- `again`
- `hard`
- `good`
- `easy`

**Foreign Keys:**
- `concept_id` -> `concepts(id)` ON DELETE CASCADE
- `variant_id` -> `variants(id)` ON DELETE CASCADE

---

### schedule

Stores SRS scheduling per concept.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `concept_id` | TEXT | PRIMARY KEY, REFERENCES concepts(id) ON DELETE CASCADE | - | Scheduled concept |
| `due_at` | TEXT | NOT NULL | - | ISO 8601 due timestamp |
| `interval_days` | REAL | NOT NULL | `1` | Current interval (days) |
| `ease_factor` | REAL | NOT NULL | `2.5` | SM-2 ease factor |

**Indexes:**

| Name | Columns | Type |
|------|---------|------|
| `idx_schedule_due` | `due_at` | B-tree |

**Foreign Keys:**
- `concept_id` -> `concepts(id)` ON DELETE CASCADE

**Notes:**
- `interval_days` minimum is 1
- `ease_factor` range: 1.3 to 2.5
- `due_at` stored as ISO 8601 string for sortable comparisons

---

## Schema Relationships

```
concepts (1) -----> (*) variants
    |
    +--------------> (1) schedule
    |
    +--------------> (*) events

variants (1) -----> (*) events
```

**Cascade Behavior:**
- Deleting a concept cascades to its variants, events, and schedule
- Deleting a variant cascades to its events

---

## Column Type Conventions

| Logical Type | SQLite Type | Format |
|--------------|-------------|--------|
| UUID | TEXT | `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` |
| Timestamp | TEXT | ISO 8601 (`datetime('now')`) |
| Boolean | INTEGER | 0 or 1 |
| JSON Array | TEXT | `'["item1", "item2"]'` |
| Enum | TEXT | Validated via CHECK constraint |
| Float | REAL | Standard IEEE 754 |
| Integer | INTEGER | 64-bit signed |

---

## Migration History

### Migration: 001_initial_schema

| Property | Value |
|----------|-------|
| Name | `001_initial_schema` |
| Applied | Initial setup |
| Direction | Up/Down |

**Up Actions:**
1. Create `concepts` table
2. Create `variants` table with indexes
3. Create `mastery` table
4. Create `events` table with indexes
5. Create `schedule` table with index

**Down Actions:**
1. Drop `idx_schedule_due` index
2. Drop `schedule` table
3. Drop `idx_events_*` indexes
4. Drop `events` table
5. Drop `mastery` table
6. Drop `idx_variants_*` indexes
7. Drop `variants` table
8. Drop `concepts` table

**Source:** `src/main/infrastructure/database/migrations/001_initial_schema.ts`

---

## Query Patterns

### Get Due Concepts

```sql
SELECT * FROM schedule
WHERE due_at <= datetime('now')
ORDER BY due_at ASC;
```

### Get Variants by Dimension

```sql
SELECT * FROM variants
WHERE dimension = ?
ORDER BY difficulty ASC;
```

### Get Recent Events

```sql
SELECT * FROM events
ORDER BY created_at DESC
LIMIT ?;
```

### Get Mastery Profile

```sql
SELECT * FROM mastery;
```

### Update Mastery After Review

```sql
UPDATE mastery
SET accuracy_ewma = ?,
    speed_ewma = ?,
    recent_count = recent_count + 1,
    updated_at = datetime('now')
WHERE dimension = ?;
```

### Update Schedule After Review

```sql
UPDATE schedule
SET due_at = ?,
    interval_days = ?,
    ease_factor = ?
WHERE concept_id = ?;
```

---

## Data Integrity

### Constraints Summary

| Table | Constraint Type | Description |
|-------|-----------------|-------------|
| `concepts` | UNIQUE | `name` must be unique |
| `variants` | CHECK | `difficulty` between 1 and 5 |
| `variants` | FK CASCADE | Delete with parent concept |
| `events` | CHECK | `result` in valid set |
| `events` | FK CASCADE | Delete with parent concept/variant |
| `schedule` | FK CASCADE | Delete with parent concept |

### Referential Integrity

Foreign key constraints enabled via:
```sql
PRAGMA foreign_keys = ON;
```

---

## Related Documentation

- [Domain Model Reference](./domain-model.md)
- [IPC API Reference](./ipc-api.md)
- [Configuration Reference](./configuration.md)
