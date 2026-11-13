import { Router } from 'express';
import { idParam } from '../middleware/validate.js';
import { listTeachers, getTeacher, listDepartments } from '../controllers/teacherController.js';

const router = Router();
router.param('id', idParam);

// Public teacher directory
router.get('/departments', listDepartments);
router.get('/', listTeachers);
router.get('/:id', getTeacher);
export default router;
