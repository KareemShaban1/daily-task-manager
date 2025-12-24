import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDailyStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { date } = req.query;
    
    // Use the date directly from query parameter (already in YYYY-MM-DD format)
    // If no date provided, use today's date
    let dateString: string;
    if (date && typeof date === 'string') {
      // Validate date format (YYYY-MM-DD)
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateString = date;
      } else {
        // Try to parse and format
        const parsedDate = new Date(date);
        dateString = parsedDate.toISOString().split('T')[0];
      }
    } else {
      // Use today's date in UTC
      const today = new Date();
      dateString = today.toISOString().split('T')[0];
    }
    
    console.log(`Calculating statistics for date: ${dateString} (requested: ${date})`);
    
    // Always recalculate statistics to ensure accuracy with date-specific tasks
    // (Don't use cached stats as they might be outdated when tasks are added/removed)
    // Calculate statistics
    // Count tasks that should appear on this date:
    // 1. Daily tasks (is_daily = 1 or TRUE) - appear on all dates
    // 2. Date-specific tasks (is_daily = 0 or FALSE AND due_date = dateString) - appear only on their due date
    const [totalTasks] = await pool.execute(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE user_id = ? 
       AND (is_active = 1 OR is_active = TRUE)
       AND (
         (is_daily = 1 OR is_daily = TRUE)
         OR ((is_daily = 0 OR is_daily = FALSE) AND due_date = ?)
       )`,
      [req.userId, dateString]
    );
    
    // Count completed tasks for this date
    // Include both daily tasks and date-specific tasks that match the date
    const [completedTasks] = await pool.execute(
      `SELECT COUNT(DISTINCT tc.task_id) as count 
       FROM task_completions tc
       INNER JOIN tasks t ON tc.task_id = t.id
       WHERE tc.user_id = ? 
       AND tc.completion_date = ?
       AND (t.is_active = 1 OR t.is_active = TRUE)
       AND (
         (t.is_daily = 1 OR t.is_daily = TRUE)
         OR ((t.is_daily = 0 OR t.is_daily = FALSE) AND t.due_date = ?)
       )`,
      [req.userId, dateString, dateString]
    );
    
    const total = (totalTasks as any[])[0]?.count || 0;
    const completed = (completedTasks as any[])[0]?.count || 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    // Debug logging
    console.log(`Statistics for ${dateString}:`, {
      total,
      completed,
      completionRate: completionRate.toFixed(2),
    });
    
    // Get active streaks
    const [activeStreaks] = await pool.execute(
      `SELECT COUNT(*) as count FROM task_streaks 
       WHERE user_id = ? AND current_streak > 0`,
      [req.userId]
    );
    
    // Get longest streak
    const [longestStreak] = await pool.execute(
      `SELECT MAX(longest_streak) as max FROM task_streaks 
       WHERE user_id = ?`,
      [req.userId]
    );
    
    const statsData = {
      user_id: req.userId,
      stat_date: dateString,
      total_tasks: total,
      completed_tasks: completed,
      completion_rate: parseFloat(completionRate.toFixed(2)),
      active_streaks: (activeStreaks as any[])[0]?.count || 0,
      longest_streak: (longestStreak as any[])[0]?.max || 0,
    };
    
    // Insert statistics
    await pool.execute(
      `INSERT INTO daily_statistics 
       (user_id, stat_date, total_tasks, completed_tasks, completion_rate, active_streaks, longest_streak)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_tasks = ?,
         completed_tasks = ?,
         completion_rate = ?,
         active_streaks = ?,
         longest_streak = ?`,
      [
        statsData.user_id,
        statsData.stat_date,
        statsData.total_tasks,
        statsData.completed_tasks,
        statsData.completion_rate,
        statsData.active_streaks,
        statsData.longest_streak,
        statsData.total_tasks,
        statsData.completed_tasks,
        statsData.completion_rate,
        statsData.active_streaks,
        statsData.longest_streak,
      ]
    );
    
    res.json(statsData);
  } catch (error) {
    console.error('Get daily statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWeeklyStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { startDate, endDate } = req.query;
    
    // Get user timezone
    const [users] = await pool.execute(
      'SELECT timezone FROM users WHERE id = ?',
      [req.userId]
    );
    const user = (users as any[])[0];
    const userTimezone = user?.timezone || 'UTC';
    
    // Calculate date range (last 7 days if not provided)
    const end = endDate
      ? new Date(endDate as string)
      : new Date();
    const localEnd = new Date(
      end.toLocaleString('en-US', { timeZone: userTimezone })
    );
    const endDateString = new Date(
      localEnd.getFullYear(),
      localEnd.getMonth(),
      localEnd.getDate()
    )
      .toISOString()
      .split('T')[0];
    
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const localStart = new Date(
      start.toLocaleString('en-US', { timeZone: userTimezone })
    );
    const startDateString = new Date(
      localStart.getFullYear(),
      localStart.getMonth(),
      localStart.getDate()
    )
      .toISOString()
      .split('T')[0];
    
    // Get statistics for date range
    const [stats] = await pool.execute(
      `SELECT * FROM daily_statistics 
       WHERE user_id = ? 
       AND stat_date BETWEEN ? AND ?
       ORDER BY stat_date ASC`,
      [req.userId, startDateString, endDateString]
    );
    
    // Calculate totals
    const totalTasks = (stats as any[]).reduce(
      (sum, s) => sum + (s.total_tasks || 0),
      0
    );
    const totalCompleted = (stats as any[]).reduce(
      (sum, s) => sum + (s.completed_tasks || 0),
      0
    );
    const avgCompletionRate =
      (stats as any[]).length > 0
        ? (stats as any[]).reduce(
            (sum, s) => sum + (s.completion_rate || 0),
            0
          ) / (stats as any[]).length
        : 0;
    
    res.json({
      startDate: startDateString,
      endDate: endDateString,
      dailyStats: stats,
      totals: {
        totalTasks,
        totalCompleted,
        averageCompletionRate: parseFloat(avgCompletionRate.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get weekly statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTaskHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { taskId, startDate, endDate, limit = 30 } = req.query;
    
    let query = `
      SELECT tc.*, t.title as task_title
      FROM task_completions tc
      INNER JOIN tasks t ON tc.task_id = t.id
      WHERE tc.user_id = ?
    `;
    
    const params: any[] = [req.userId];
    
    if (taskId) {
      query += ' AND tc.task_id = ?';
      params.push(taskId);
    }
    
    if (startDate) {
      query += ' AND tc.completion_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND tc.completion_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY tc.completion_date DESC, tc.completed_at DESC LIMIT ?';
    params.push(parseInt(limit as string));
    
    const [completions] = await pool.execute(query, params);
    
    res.json(completions);
  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

