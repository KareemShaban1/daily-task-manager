import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCategories = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [categories] = await pool.execute(
      'SELECT * FROM task_categories WHERE user_id = ? ORDER BY name ASC',
      [req.userId]
    );
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    
    const [categories] = await pool.execute(
      'SELECT * FROM task_categories WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    if (!Array.isArray(categories) || categories.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    res.json(categories[0]);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, description, icon, color } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists for this user
    const [existing] = await pool.execute(
      'SELECT id FROM task_categories WHERE slug = ? AND user_id = ?',
      [slug, req.userId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      res.status(409).json({ error: 'Category with this name already exists' });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO task_categories (user_id, name, slug, description, icon, color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, name, slug, description || null, icon || null, color || null]
    );

    const insertResult = result as { insertId: number };
    const categoryId = insertResult.insertId;

    const [categories] = await pool.execute(
      'SELECT * FROM task_categories WHERE id = ?',
      [categoryId]
    );

    res.status(201).json((categories as any[])[0]);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    // Check if category exists and belongs to user
    const [categories] = await pool.execute(
      'SELECT id, slug FROM task_categories WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!Array.isArray(categories) || categories.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      // Generate new slug if name changed
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug conflicts with existing category for this user
      const [existing] = await pool.execute(
        'SELECT id FROM task_categories WHERE slug = ? AND id != ? AND user_id = ?',
        [slug, id, req.userId]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        res.status(409).json({ error: 'Category with this name already exists' });
        return;
      }

      updates.push('name = ?', 'slug = ?');
      params.push(name, slug);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }

    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon || null);
    }

    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color || null);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    params.push(id, req.userId);

    await pool.execute(
      `UPDATE task_categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    const [updated] = await pool.execute(
      'SELECT * FROM task_categories WHERE id = ?',
      [id]
    );

    res.json((updated as any[])[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Check if category exists and belongs to user
    const [categories] = await pool.execute(
      'SELECT id FROM task_categories WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!Array.isArray(categories) || categories.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if category is being used by any tasks of this user
    const [tasks] = await pool.execute(
      'SELECT COUNT(*) as count FROM tasks WHERE category_id = ? AND user_id = ?',
      [id, req.userId]
    );

    const taskCount = (tasks as any[])[0]?.count || 0;

    if (taskCount > 0) {
      res.status(409).json({
        error: `Cannot delete category. It is being used by ${taskCount} task(s). Please reassign or delete those tasks first.`,
      });
      return;
    }

    await pool.execute('DELETE FROM task_categories WHERE id = ? AND user_id = ?', [id, req.userId]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

