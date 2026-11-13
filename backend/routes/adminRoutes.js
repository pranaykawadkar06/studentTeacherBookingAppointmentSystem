import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';
import { teacherCreateSchema, teacherUpdateSchema, studentStatusSchema } from '../utils/schemas.js';
import { createTeacher, updateTeacher, deleteTeacher, setStudentStatus } from '../controllers/adminController.js';

const router = Router();
router.param('id', idParam);
router.use(protect, authorize('admin'));

router.post('/teachers', validate(teacherCreateSchema), createTeacher);
router.put('/teachers/:id', validate(teacherUpdateSchema), updateTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.patch('/students/:id/status', validate(studentStatusSchema), setStudentStatus);
export default router;
