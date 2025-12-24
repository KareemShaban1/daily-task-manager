import cron from 'node-cron';
import { sendTaskReminders, checkMissedTasks } from './notificationService.js';

// Run every minute to check for due reminders
cron.schedule('* * * * *', async () => {
  console.log('Running reminder check...');
  await sendTaskReminders();
});

// Check for missed tasks daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Checking for missed tasks...');
  await checkMissedTasks();
});

console.log('Cron jobs initialized');


