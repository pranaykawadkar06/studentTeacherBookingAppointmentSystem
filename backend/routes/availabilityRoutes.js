import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { slotCreateSchema, slotUpdateSchema } from '../utils/schemas.js';
import { createSlots, mySlots, teacherSlots, getSlot, updateSlot, deleteSlot } from '../controllers/availabilityController.js';

const router = Router();
router.param('id', idParam);
router.param('teacherId', idParam);
router.use(protect);

router.get('/teacher/:teacherId', teacherSlots);
router.get('/mine', authorize('teacher'), mySlots);
router.post('/', authorize('teacher'), validate(slotCreateSchema), createSlots);
router.get('/:id', authorize('teacher'), getSlot);
router.put('/:id', authorize('teacher'), validate(slotUpdateSchema), updateSlot);
router.delete('/:id', authorize('teacher'), deleteSlot);
export default router;
