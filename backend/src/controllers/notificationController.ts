import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { unreadOnly, limit = 50 } = req.query;
    
    let query = `
      SELECT n.*, t.title as task_title
      FROM notifications n
      LEFT JOIN tasks t ON n.task_id = t.id
      WHERE n.user_id = ?
    `;
    
    const params: any[] = [req.userId];
    
    if (unreadOnly === 'true') {
      query += ' AND n.is_read = FALSE';
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(parseInt(limit as string));
    
    const [notifications] = await pool.execute(query, params);
    
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNotificationRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { id } = req.params;
    
    const [result] = await pool.execute(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = ? AND user_id = ?`,
      [id, req.userId]
    );
    
    const updateResult = result as { affectedRows: number };
    
    if (updateResult.affectedRows === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    await pool.execute(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = ? AND is_read = FALSE`,
      [req.userId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    const deleteResult = result as { affectedRows: number };
    
    if (deleteResult.affectedRows === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const [result] = await pool.execute(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? AND is_read = FALSE`,
      [req.userId]
    );
    
    const count = (result as any[])[0]?.count || 0;
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


