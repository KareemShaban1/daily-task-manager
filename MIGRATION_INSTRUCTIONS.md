# Database Migration: Add Due Date Support

This migration adds support for date-specific (non-repeating) tasks.

## Migration Steps

1. **Run the migration SQL** to add the `due_date` column to your existing database:

```sql
ALTER TABLE tasks 
ADD COLUMN due_date DATE NULL AFTER is_daily,
ADD INDEX idx_due_date (due_date);
```

### Option 1: Using MySQL Command Line

```bash
mysql -u your_username -p your_database_name < backend/src/database/migrations/add_task_due_date.sql
```

### Option 2: Using MySQL Workbench or phpMyAdmin

1. Open your MySQL client
2. Select your database
3. Run the SQL from `backend/src/database/migrations/add_task_due_date.sql`

### Option 3: If starting fresh

If you're creating a new database, the updated `schema.sql` already includes the `due_date` field, so no migration is needed.

## How It Works

- **Daily Tasks** (`is_daily = TRUE`): Appear on all days (due_date is ignored)
- **Date-Specific Tasks** (`is_daily = FALSE` with `due_date` set): Appear only on the specified date
- **Template Tasks** (`is_daily = FALSE` with `due_date = NULL`): Don't appear in calendar (can be used as templates)

## Testing

After running the migration:
1. Create a new task
2. Toggle "Daily Task" to OFF
3. Select a specific date
4. The task should only appear on that date in the calendar


