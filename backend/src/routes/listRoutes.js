import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { upload } from '../utils/fileUpload.js';
import { uploadAndDistribute, getDistributedByAgent } from '../controllers/listController.js';

const router = Router();

router.post('/upload', authMiddleware, adminOnly, upload.single('file'), uploadAndDistribute);
router.get('/', authMiddleware, adminOnly, getDistributedByAgent);

export default router;