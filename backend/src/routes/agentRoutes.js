import { Router } from 'express';
import { addAgent, getAgents } from '../controllers/agentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = Router();

router.post('/add', authMiddleware, adminOnly, addAgent);
router.get('/', authMiddleware, adminOnly, getAgents);


export default router;