import { z } from 'zod';

const str = (label, { min = 1, max = 200 } = {}) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optStr = (label, max = 200) =>
  z.string({ invalid_type_error: `${label} must be text` }).trim().max(max, `${label} must be at most ${max} characters`).optional();

const objectId = (label = 'Id') =>
  z.string({ required_error: `${label} is required` }).regex(/^[0-9a-fA-F]{24}$/, `${label} is invalid`);

const email = str('Email', { max: 120 }).toLowerCase().email('Enter a valid email address');

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);
const years = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(60).optional());
const imageUrl = z.string().trim().url('Profile image must be a valid URL').max(500).or(z.literal('')).optional();

// ---- Auth ----
export const registerSchema = z.object({
  name: str('Name', { min: 2, max: 80 }),
  email,
  password: passwordSchema,
  course: optStr('Course', 100),
  rollNumber: optStr('Roll number', 40),
  phone: optStr('Phone', 20),
});
export const loginSchema = z.object({ email, password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required') });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset link is invalid' }).regex(/^[a-fA-F0-9]{64}$/, 'This reset link is invalid. Request a new one.'),
  password: passwordSchema,
});

// ---- Users ----
export const profileSchema = z.object({
  name: str('Name', { min: 2, max: 80 }).optional(),
  phone: optStr('Phone', 20),
  bio: optStr('Bio', 600),
  profileImage: imageUrl,
  department: optStr('Department', 100),
  subject: optStr('Subject', 100),
  qualification: optStr('Qualification', 150),
  officeLocation: optStr('Office location', 100),
  experienceYears: years,
  course: optStr('Course', 100),
  rollNumber: optStr('Roll number', 40),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// ---- Admin ----
const teacherFields = {
  name: str('Name', { min: 2, max: 80 }),
  email,
  department: str('Department', { max: 100 }),
  subject: str('Subject', { max: 100 }),
  qualification: str('Qualification', { max: 150 }),
  bio: optStr('Bio', 600),
  phone: optStr('Phone', 20),
  officeLocation: optStr('Office location', 100),
  experienceYears: years,
  profileImage: imageUrl,
};
export const teacherCreateSchema = z.object({ ...teacherFields, password: passwordSchema });
export const teacherUpdateSchema = z.object({ ...teacherFields, password: passwordSchema.or(z.literal('')).optional() });
export const studentStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending'], { required_error: 'Status is required', invalid_type_error: 'Invalid status' }),
});

// ---- Availability ----
const date = str('Date', { max: 10 });
const time = (label) => str(label, { max: 5 });
export const slotCreateSchema = z.object({
  date,
  startTime: time('Start time'),
  endTime: time('End time'),
  slotDuration: z.coerce.number({ invalid_type_error: 'Slot duration must be a number' }).int().min(10, 'Slot duration must be at least 10 minutes').max(180, 'Slot duration must be at most 180 minutes'),
  repeatWeeks: z.coerce.number().int().min(0).max(8, 'You can repeat for at most 8 weeks').default(0),
});
export const slotUpdateSchema = z.object({
  date: date.optional(),
  startTime: time('Start time').optional(),
  endTime: time('End time').optional(),
  status: z.enum(['available', 'blocked']).optional(),
});

// ---- Appointments ----
export const appointmentCreateSchema = z.object({
  availabilityId: objectId('Slot'),
  purpose: str('Purpose', { min: 5, max: 500 }),
  notifyTeacher: z.boolean().optional().default(true),
});
export const approveSchema = z.object({ note: optStr('Note', 500) });
export const rejectSchema = z.object({ reason: optStr('Reason', 500) });
export const cancelSchema = z.object({ reason: optStr('Reason', 500) });

// ---- Messages ----
export const messageSchema = z.object({
  recipientId: objectId('Recipient'),
  appointmentId: objectId('Appointment').optional(),
  subject: str('Subject', { min: 2, max: 120 }),
  content: str('Message', { max: 2000 }),
  notifyByEmail: z.boolean().optional().default(false),
});
