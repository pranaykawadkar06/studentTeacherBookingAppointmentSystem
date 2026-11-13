import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const isTeacher = function () {
  return this.role === 'teacher';
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true, default: 'student' },
    registrationStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
    reviewedAt: Date,

    // Password reset (token is stored only as a SHA-256 hash)
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    // Sessions issued before this moment are rejected
    passwordChangedAt: Date,

    // Teacher fields (required only for teachers)
    department: { type: String, trim: true, maxlength: 100, required: [isTeacher, 'Department is required for teachers'] },
    subject: { type: String, trim: true, maxlength: 100, required: [isTeacher, 'Subject is required for teachers'] },
    qualification: { type: String, trim: true, maxlength: 150, required: [isTeacher, 'Qualification is required for teachers'] },
    officeLocation: { type: String, trim: true, maxlength: 100 },
    experienceYears: { type: Number, min: 0, max: 60 },

    // Student fields
    course: { type: String, trim: true, maxlength: 100 },
    rollNumber: { type: String, trim: true, maxlength: 40 },

    // Shared
    phone: { type: String, trim: true, maxlength: 20 },
    bio: { type: String, trim: true, maxlength: 600 },
    profileImage: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, registrationStatus: 1, createdAt: -1 });
userSchema.index({ role: 1, department: 1, subject: 1 });

userSchema.pre('validate', function (next) {
  if (this.isNew && !this.registrationStatus) {
    this.registrationStatus = this.role === 'student' ? 'pending' : 'approved';
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.passwordChangedAt;
    delete ret.__v;
    return ret;
  },
});

export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);
export default mongoose.model('User', userSchema);
