import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { profileSchema, changePasswordSchema } from '../utils/schemas.js';
import { updateMe, changePassword, listUsers, getUser, listStudents } from '../controllers/userController.js';

const router = Router();
router.param('id', idParam);

router.put('/me', protect, validate(profileSchema), updateMe);
router.put('/me/password', protect, validate(changePasswordSchema), changePassword);
router.get('/students', protect, authorize('teacher'), listStudents);
router.get('/', protect, authorize('admin'), listUsers);
router.get('/:id', protect, authorize('admin'), getUser);
export default router;
