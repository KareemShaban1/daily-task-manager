import pool from '../database/connection.js';
import { sendTaskReminderEmail, sendEmail } from '../utils/email.js';
import { calculateNextReminderTime } from '../utils/timezone.js';

export const sendTaskReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    
    // Get reminders that are due
    const [reminders] = await pool.execute(
      `SELECT sr.*, t.title, t.user_id, u.email, u.first_name, u.timezone
       FROM scheduled_reminders sr
       INNER JOIN tasks t ON sr.task_id = t.id
       INNER JOIN users u ON sr.user_id = u.id
       WHERE sr.is_active = TRUE
       AND sr.next_reminder_at <= ?
       AND t.is_active = TRUE
       AND t.reminder_enabled = TRUE`,
      [now]
    );
    
    const remindersArray = reminders as any[];
    
    for (const reminder of remindersArray) {
      try {
        // Check user settings
        const [settings] = await pool.execute(
          `SELECT email_notifications_enabled, in_app_notifications_enabled
           FROM user_settings WHERE user_id = ?`,
          [reminder.user_id]
        );
        
        const userSettings = (settings as any[])[0] || {
          email_notifications_enabled: true,
          in_app_notifications_enabled: true,
        };
        
        // Create in-app notification
        if (userSettings.in_app_notifications_enabled) {
          await pool.execute(
            `INSERT INTO notifications 
             (user_id, task_id, type, title, message, notification_method)
             VALUES (?, ?, 'reminder', ?, ?, 'in_app')`,
            [
              reminder.user_id,
              reminder.task_id,
              `Reminder: ${reminder.title}`,
              `It's time for: ${reminder.title}`,
            ]
          );
        }
        
        // Send email notification
        if (userSettings.email_notifications_enabled) {
          const emailSent = await sendTaskReminderEmail(
            reminder.email,
            reminder.title,
            reminder.reminder_time
          );
          
          if (emailSent) {
            await pool.execute(
              `UPDATE notifications 
               SET email_sent = TRUE, email_sent_at = NOW()
               WHERE user_id = ? AND task_id = ? AND type = 'reminder'
               ORDER BY created_at DESC LIMIT 1`,
              [reminder.user_id, reminder.task_id]
            );
          }
        }
        
        // Update reminder to next occurrence
        const nextReminder = calculateNextReminderTime(
          reminder.reminder_time,
          reminder.timezone
        );
        
        await pool.execute(
          `UPDATE scheduled_reminders 
           SET next_reminder_at = ?, last_sent_at = NOW()
           WHERE id = ?`,
          [nextReminder, reminder.id]
        );
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }
    
    console.log(`Processed ${remindersArray.length} reminders`);
  } catch (error) {
    console.error('Error in sendTaskReminders:', error);
  }
};

export const checkMissedTasks = async (): Promise<void> => {
  try {
    // Get user timezone
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get all daily tasks that weren't completed yesterday
    const [missedTasks] = await pool.execute(
      `SELECT DISTINCT t.id, t.title, t.user_id, u.email, u.timezone
       FROM tasks t
       INNER JOIN users u ON t.user_id = u.id
       LEFT JOIN task_completions tc ON t.id = tc.task_id 
         AND tc.user_id = t.user_id
         AND tc.completion_date = DATE(?)
       WHERE t.is_active = TRUE
       AND t.is_daily = TRUE
       AND tc.id IS NULL
       AND DATE(?) >= DATE(t.created_at)`,
      [yesterday, yesterday]
    );
    
    const missedTasksArray = missedTasks as any[];
    
    for (const task of missedTasksArray) {
      try {
        // Check user settings
        const [settings] = await pool.execute(
          `SELECT email_notifications_enabled, in_app_notifications_enabled
           FROM user_settings WHERE user_id = ?`,
          [task.user_id]
        );
        
        const userSettings = (settings as any[])[0] || {
          email_notifications_enabled: true,
          in_app_notifications_enabled: true,
        };
        
        // Create missed task notification
        if (userSettings.in_app_notifications_enabled) {
          await pool.execute(
            `INSERT INTO notifications 
             (user_id, task_id, type, title, message, notification_method)
             VALUES (?, ?, 'missed', ?, ?, 'in_app')`,
            [
              task.user_id,
              task.id,
              `Missed Task: ${task.title}`,
              `You missed completing "${task.title}" yesterday.`,
            ]
          );
        }
        
        // Send email if enabled
        if (userSettings.email_notifications_enabled) {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Missed Task</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #DC2626;">Missed Task Alert</h1>
                  <p>You missed completing the following task yesterday:</p>
                  <div style="background-color: #FEE2E2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h2 style="margin: 0; color: #991B1B;">${task.title}</h2>
                  </div>
                  <p>Don't worry! You can still complete it today to maintain your streak.</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                     style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Dashboard
                  </a>
                </div>
              </body>
            </html>
          `;
          
          await sendEmail({
            to: task.email,
            subject: `Missed Task: ${task.title}`,
            html,
          });
        }
      } catch (error) {
        console.error(`Error processing missed task ${task.id}:`, error);
      }
    }
    
    console.log(`Checked ${missedTasksArray.length} missed tasks`);
  } catch (error) {
    console.error('Error in checkMissedTasks:', error);
  }
};


