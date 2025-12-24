import express from 'express';
import {
  getDailyStatistics,
  getWeeklyStatistics,
  getTaskHistory,
} from '../controllers/statisticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/daily', getDailyStatistics);
router.get('/weekly', getWeeklyStatistics);
router.get('/history', getTaskHistory);

export default router;


