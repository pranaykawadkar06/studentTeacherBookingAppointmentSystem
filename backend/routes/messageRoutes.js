import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { messageSchema } from '../utils/schemas.js';
import { sendMessage, listMessages, markRead } from '../controllers/messageController.js';

const router = Router();
router.param('id', idParam);
router.use(protect, authorize('student', 'teacher'));

router.get('/', listMessages);
router.post('/', validate(messageSchema), sendMessage);
router.patch('/:id/read', markRead);
export default router;
