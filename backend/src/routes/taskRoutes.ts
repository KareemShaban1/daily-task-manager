import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/', getTasks);
// More specific routes must come before generic :id route
router.post('/:id(\\d+)/complete', completeTask);
router.post('/:id(\\d+)/uncomplete', uncompleteTask);
router.get('/:id(\\d+)', getTask);
router.put('/:id(\\d+)', updateTask);
router.delete('/:id(\\d+)', deleteTask);

export default router;

