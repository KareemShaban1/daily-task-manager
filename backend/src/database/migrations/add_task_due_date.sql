-- Migration: Add due_date field to tasks table for date-specific tasks
-- Run this migration to add support for non-repeating tasks with specific dates

ALTER TABLE tasks 
ADD COLUMN due_date DATE NULL AFTER is_daily,
ADD INDEX idx_due_date (due_date);

-- Note: 
-- - If is_daily = TRUE, task appears every day (due_date is ignored)
-- - If is_daily = FALSE and due_date is set, task appears only on that specific date
-- - If is_daily = FALSE and due_date is NULL, task is a template (not shown in calendar)


