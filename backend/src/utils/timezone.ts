import { DateTime } from 'luxon';

export const convertToUserTimezone = (
  date: Date | string,
  timezone: string
): Date => {
  const dt = DateTime.fromJSDate(
    typeof date === 'string' ? new Date(date) : date,
    { zone: 'UTC' }
  ).setZone(timezone);
  
  return dt.toJSDate();
};

export const getCurrentDateInTimezone = (timezone: string): Date => {
  return DateTime.now().setZone(timezone).toJSDate();
};

export const formatTimeForTimezone = (
  time: string,
  timezone: string
): string => {
  const [hours, minutes] = time.split(':');
  const dt = DateTime.now()
    .setZone(timezone)
    .set({ hour: parseInt(hours), minute: parseInt(minutes), second: 0 });
  
  return dt.toFormat('HH:mm');
};

export const calculateNextReminderTime = (
  reminderTime: string,
  timezone: string
): Date => {
  const [hours, minutes] = reminderTime.split(':');
  const now = DateTime.now().setZone(timezone);
  let reminder = now.set({ hour: parseInt(hours), minute: parseInt(minutes), second: 0 });
  
  // If the reminder time has passed today, schedule for tomorrow
  if (reminder <= now) {
    reminder = reminder.plus({ days: 1 });
  }
  
  return reminder.toJSDate();
};

