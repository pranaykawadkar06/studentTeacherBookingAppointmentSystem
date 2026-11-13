import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { appointmentCreateSchema, approveSchema, rejectSchema, cancelSchema } from '../utils/schemas.js';
import {
  createAppointment, listAppointments, getAppointment, approveAppointment, rejectAppointment, cancelAppointment,
} from '../controllers/appointmentController.js';

const router = Router();
router.param('id', idParam);
router.use(protect);

router.post('/', authorize('student'), validate(appointmentCreateSchema), createAppointment);
router.get('/', listAppointments); // scoped by role inside the controller
router.get('/:id', getAppointment);
router.patch('/:id/approve', authorize('teacher'), validate(approveSchema), approveAppointment);
router.patch('/:id/reject', authorize('teacher'), validate(rejectSchema), rejectAppointment);
router.patch('/:id/cancel', authorize('student', 'teacher'), validate(cancelSchema), cancelAppointment);
export default router;
