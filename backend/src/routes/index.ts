import express from 'express';
import authRoutes from './authRoutes.js';
import taskRoutes from './taskRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import statisticsRoutes from './statisticsRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/categories', categoryRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/notifications', notificationRoutes);

export default router;


