# Database Migration Guide

This guide explains how to manage database migrations and reset your database.

## Available Commands

### Run Migrations (Incremental)
Run only new migrations that haven't been applied yet:
```bash
npm run migrate
```

This will:
- Create the database if it doesn't exist
- Run any pending migration files in order
- Skip migrations that have already been applied

### Fresh Database Reset
Drop all tables and recreate the database from scratch:
```bash
npm run migrate:fresh
```

This will:
- ⚠️ **DELETE ALL DATA** in the database
- Drop all existing tables
- Run the full schema.sql
- Run all migrations in order
- Give you a clean, fresh database

## Migration Files

Migration files are located in `backend/src/database/migrations/` and are executed in alphabetical order. Each migration file should:
- Be named descriptively (e.g., `add_user_id_to_categories.sql`)
- Include comments explaining what the migration does
- Handle cases where the migration has already been applied (idempotent)

## Current Migrations

1. **add_task_due_date.sql** - Adds `due_date` field to tasks table
2. **add_user_id_to_categories.sql** - Makes categories user-specific by adding `user_id` column

## Workflow

### For Development
1. Make changes to the database schema
2. Create a new migration file in `migrations/` directory
3. Test the migration: `npm run migrate`
4. If you need to start fresh: `npm run migrate:fresh`

### For Production
1. Always test migrations in a development environment first
2. Backup your database before running migrations
3. Run migrations incrementally: `npm run migrate`
4. Never use `migrate:fresh` in production (it deletes all data!)

## Troubleshooting

### Migration Already Applied
If you see "already exists" errors, the migration has likely already been run. The script will skip these automatically.

### Foreign Key Errors
If you encounter foreign key constraint errors, make sure migrations are run in the correct order. The script runs them alphabetically.

### Connection Errors
Ensure your `.env` file has the correct database credentials:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Example Usage

```bash
# First time setup - fresh database
npm run migrate:fresh

# After making schema changes - run new migrations
npm run migrate

# If you need to reset everything during development
npm run migrate:fresh
```

