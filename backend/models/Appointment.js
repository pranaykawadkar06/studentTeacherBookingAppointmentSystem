import mongoose from 'mongoose';

const ACTIVE = ['pending', 'approved'];

const appointmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    availability: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    purpose: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'], default: 'pending' },
    // true while the appointment holds its slot (pending/approved). Used by the unique partial indexes.
    isActive: { type: Boolean, default: true },
    decisionNote: { type: String, trim: true, maxlength: 500 },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    cancelledBy: { type: String, enum: ['student', 'teacher'] },
  },
  { timestamps: true }
);

appointmentSchema.pre('validate', function (next) {
  this.isActive = ACTIVE.includes(this.status);
  next();
});

// Double-booking guards enforced by MongoDB itself (race-condition proof):
// at most one active appointment per teacher start time, and per availability slot.
appointmentSchema.index(
  { teacher: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: 'unique_active_teacher_start' }
);
appointmentSchema.index(
  { availability: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: 'unique_active_slot' }
);
appointmentSchema.index({ student: 1, startAt: -1 });
appointmentSchema.index({ teacher: 1, status: 1, startAt: 1 });
appointmentSchema.index({ status: 1, createdAt: -1 });
appointmentSchema.index({ status: 1, endAt: 1 });

export default mongoose.model('Appointment', appointmentSchema);
