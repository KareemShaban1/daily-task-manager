import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateNextReminderTime } from '../utils/timezone.js';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const {
      title,
      description,
      categoryId,
      isDaily = true,
      dueDate,
      reminderEnabled = true,
      reminderTimes = [],
      timezone,
      priority = 'medium',
      color,
      icon,
    } = req.body;
    
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    
    // Get user timezone if not provided
    const [users] = await pool.execute(
      'SELECT timezone FROM users WHERE id = ?',
      [req.userId]
    );
    const user = (users as any[])[0];
    const taskTimezone = timezone || user?.timezone || 'UTC';
    
    // Create task
    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (user_id, category_id, title, description, is_daily, due_date, is_active, 
        reminder_enabled, reminder_times, timezone, priority, color, icon)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        categoryId || null,
        title,
        description || null,
        isDaily,
        dueDate || null,
        reminderEnabled,
        JSON.stringify(reminderTimes),
        taskTimezone,
        priority,
        color || null,
        icon || null,
      ]
    );
    
    const insertResult = result as { insertId: number };
    const taskId = insertResult.insertId;
    
    // Create scheduled reminders if enabled
    if (reminderEnabled && Array.isArray(reminderTimes) && reminderTimes.length > 0) {
      for (const reminderTime of reminderTimes) {
        const nextReminder = calculateNextReminderTime(reminderTime, taskTimezone);
        
        await pool.execute(
          `INSERT INTO scheduled_reminders 
           (task_id, user_id, reminder_time, timezone, next_reminder_at)
           VALUES (?, ?, ?, ?, ?)`,
          [taskId, req.userId, reminderTime, taskTimezone, nextReminder]
        );
      }
    }
    
    // Initialize streak
    await pool.execute(
      `INSERT INTO task_streaks (task_id, user_id) VALUES (?, ?)`,
      [taskId, req.userId]
    );
    
    // Get created task
    const [tasks] = await pool.execute(
      `SELECT t.*, c.name as category_name, c.slug as category_slug
       FROM tasks t
       LEFT JOIN task_categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [taskId]
    );
    
    const task = (tasks as any[])[0];
    if (task.reminder_times) {
      task.reminder_times = JSON.parse(task.reminder_times);
    }
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { categoryId, isActive, isDaily } = req.query;
    
    let query = `
      SELECT t.*, c.name as category_name, c.slug as category_slug,
             ts.current_streak, ts.longest_streak
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      LEFT JOIN task_streaks ts ON t.id = ts.task_id AND ts.user_id = ?
      WHERE t.user_id = ?
    `;
    
    const params: any[] = [req.userId, req.userId];
    
    if (categoryId) {
      query += ' AND t.category_id = ?';
      params.push(categoryId);
    }
    
    if (isActive !== undefined) {
      query += ' AND t.is_active = ?';
      params.push(isActive === 'true');
    }
    
    if (isDaily !== undefined) {
      query += ' AND t.is_daily = ?';
      params.push(isDaily === 'true');
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const [tasks] = await pool.execute(query, params);
    
    const tasksArray = tasks as any[];
    tasksArray.forEach((task) => {
      if (task.reminder_times) {
        task.reminder_times = JSON.parse(task.reminder_times);
      }
    });
    
    res.json(tasksArray);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { id } = req.params;
    
    const [tasks] = await pool.execute(
      `SELECT t.*, c.name as category_name, c.slug as category_slug,
              ts.current_streak, ts.longest_streak, ts.last_completion_date
       FROM tasks t
       LEFT JOIN task_categories c ON t.category_id = c.id
       LEFT JOIN task_streaks ts ON t.id = ts.task_id AND ts.user_id = ?
       WHERE t.id = ? AND t.user_id = ?`,
      [req.userId, id, req.userId]
    );
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const task = tasks[0] as any;
    if (task.reminder_times) {
      task.reminder_times = JSON.parse(task.reminder_times);
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      isDaily,
      dueDate,
      isActive,
      reminderEnabled,
      reminderTimes,
      timezone,
      priority,
      color,
      icon,
    } = req.body;
    
    // Check if task exists and belongs to user
    const [tasks] = await pool.execute(
      'SELECT id, timezone FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const existingTask = tasks[0] as { timezone: string };
    const taskTimezone = timezone || existingTask.timezone;
    
    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(categoryId);
    }
    if (isDaily !== undefined) {
      updates.push('is_daily = ?');
      params.push(isDaily);
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(dueDate || null);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive);
    }
    if (reminderEnabled !== undefined) {
      updates.push('reminder_enabled = ?');
      params.push(reminderEnabled);
    }
    if (reminderTimes !== undefined) {
      updates.push('reminder_times = ?');
      params.push(JSON.stringify(reminderTimes));
    }
    if (timezone !== undefined) {
      updates.push('timezone = ?');
      params.push(timezone);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    
    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    
    params.push(id, req.userId);
    
    await pool.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    
    // Update scheduled reminders if reminder times changed
    if (reminderTimes !== undefined) {
      // Delete existing reminders
      await pool.execute(
        'DELETE FROM scheduled_reminders WHERE task_id = ?',
        [id]
      );
      
      // Create new reminders if enabled
      if (reminderEnabled !== false && Array.isArray(reminderTimes) && reminderTimes.length > 0) {
        for (const reminderTime of reminderTimes) {
          const nextReminder = calculateNextReminderTime(reminderTime, taskTimezone);
          
          await pool.execute(
            `INSERT INTO scheduled_reminders 
             (task_id, user_id, reminder_time, timezone, next_reminder_at)
             VALUES (?, ?, ?, ?, ?)`,
            [id, req.userId, reminderTime, taskTimezone, nextReminder]
          );
        }
      }
    }
    
    // Get updated task
    const [updatedTasks] = await pool.execute(
      `SELECT t.*, c.name as category_name, c.slug as category_slug
       FROM tasks t
       LEFT JOIN task_categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    
    const task = (updatedTasks as any[])[0];
    if (task.reminder_times) {
      task.reminder_times = JSON.parse(task.reminder_times);
    }
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    const deleteResult = result as { affectedRows: number };
    
    if (deleteResult.affectedRows === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { id } = req.params;
    const { notes, completionDate } = req.body;
    
    // Get user timezone
    const [users] = await pool.execute(
      'SELECT timezone FROM users WHERE id = ?',
      [req.userId]
    );
    const user = (users as any[])[0];
    const userTimezone = user?.timezone || 'UTC';
    
    // Get current date in user's timezone
    const today = new Date();
    const localDate = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }));
    const dateToUse = completionDate 
      ? new Date(completionDate) 
      : new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
    
    const dateString = dateToUse.toISOString().split('T')[0];
    
    // Check if task exists and belongs to user
    const [tasks] = await pool.execute(
      'SELECT id, is_daily FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    // Insert or update completion
    await pool.execute(
      `INSERT INTO task_completions (task_id, user_id, completion_date, notes)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         completed_at = CURRENT_TIMESTAMP,
         notes = COALESCE(?, notes)`,
      [id, req.userId, dateString, notes || null, notes || null]
    );
    
    // Update streak
    await updateStreak(Number(id), req.userId, dateString);
    
    res.json({ message: 'Task completed successfully', date: dateString });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uncompleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { id } = req.params;
    const { completionDate } = req.body;
    
    // Get user timezone
    const [users] = await pool.execute(
      'SELECT timezone FROM users WHERE id = ?',
      [req.userId]
    );
    const user = (users as any[])[0];
    const userTimezone = user?.timezone || 'UTC';
    
    // Get current date in user's timezone
    const today = new Date();
    const localDate = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }));
    const dateToUse = completionDate 
      ? new Date(completionDate) 
      : new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
    
    const dateString = dateToUse.toISOString().split('T')[0];
    
    // Delete completion
    const [result] = await pool.execute(
      'DELETE FROM task_completions WHERE task_id = ? AND user_id = ? AND completion_date = ?',
      [id, req.userId, dateString]
    );
    
    const deleteResult = result as { affectedRows: number };
    
    if (deleteResult.affectedRows === 0) {
      res.status(404).json({ error: 'Completion not found' });
      return;
    }
    
    // Update streak
    await updateStreak(Number(id), req.userId, dateString);
    
    res.json({ message: 'Task uncompleted successfully' });
  } catch (error) {
    console.error('Uncomplete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to update streak
async function updateStreak(taskId: number, userId: number, completionDate: string): Promise<void> {
  // Get all completions for this task, ordered by date
  const [completions] = await pool.execute(
    `SELECT completion_date 
     FROM task_completions 
     WHERE task_id = ? AND user_id = ?
     ORDER BY completion_date DESC`,
    [taskId, userId]
  );
  
  const completionDates = (completions as any[]).map((c) => c.completion_date);
  
  if (completionDates.length === 0) {
    // No completions, reset streak
    await pool.execute(
      `UPDATE task_streaks 
       SET current_streak = 0, last_completion_date = NULL, streak_start_date = NULL
       WHERE task_id = ? AND user_id = ?`,
      [taskId, userId]
    );
    return;
  }
  
  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let streakStart: string | null = null;
  let tempStreak = 0;
  let tempStart: string | null = null;
  
  // Sort dates descending
  const sortedDates = [...completionDates].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;
    
    if (prevDate) {
      const daysDiff = Math.floor(
        (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        // Consecutive day
        tempStreak++;
        if (tempStart === null) {
          tempStart = sortedDates[i - 1];
        }
      } else {
        // Streak broken
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (i === 1) {
          // First completion is the start of a new streak
          currentStreak = 1;
          streakStart = sortedDates[0];
        }
        tempStreak = 1;
        tempStart = sortedDates[i];
      }
    } else {
      // First date
      tempStreak = 1;
      tempStart = sortedDates[i];
      currentStreak = 1;
      streakStart = sortedDates[i];
    }
  }
  
  // Check if temp streak is longer
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }
  
  // Update streak record
  await pool.execute(
    `INSERT INTO task_streaks (task_id, user_id, current_streak, longest_streak, last_completion_date, streak_start_date)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       current_streak = ?,
       longest_streak = GREATEST(longest_streak, ?),
       last_completion_date = ?,
       streak_start_date = ?`,
    [
      taskId,
      userId,
      currentStreak,
      longestStreak,
      sortedDates[0],
      streakStart,
      currentStreak,
      longestStreak,
      sortedDates[0],
      streakStart,
    ]
  );
}

