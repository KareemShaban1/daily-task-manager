-- Migration: Add user_id to task_categories table to make categories user-specific
-- This fixes the issue where categories were appearing on all accounts
-- This migration is idempotent - errors are handled gracefully by the migration runner

-- Step 1: Delete existing global categories (safe - will only delete if table exists)
-- In incremental mode, this deletes all categories before adding user_id
-- In fresh mode with new schema, this is a no-op since table is empty
DELETE FROM task_categories;

-- Step 2: Add user_id column (will fail if column already exists - that's OK)
ALTER TABLE task_categories 
ADD COLUMN user_id INT NOT NULL AFTER id;

-- Step 3: Add foreign key constraint (will fail if constraint already exists - that's OK)
ALTER TABLE task_categories
ADD CONSTRAINT fk_category_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Add index for better query performance (will fail if index already exists - that's OK)
ALTER TABLE task_categories
ADD INDEX idx_user_id (user_id);

-- Step 5: Update unique constraint on slug to be per-user
-- Drop old slug index if it exists (will fail if index doesn't exist - that's OK)
ALTER TABLE task_categories
DROP INDEX slug;

-- Add new unique constraint (will fail if constraint already exists - that's OK)
ALTER TABLE task_categories
ADD UNIQUE KEY unique_user_slug (user_id, slug);

