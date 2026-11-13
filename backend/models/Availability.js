import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD (teacher's local date)
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    slotDuration: { type: Number, required: true, min: 10, max: 180 },
    status: { type: String, enum: ['available', 'booked', 'blocked'], default: 'available' },
  },
  { timestamps: true }
);

// A teacher can never have two slots that start at the same moment.
availabilitySchema.index({ teacher: 1, startAt: 1 }, { unique: true });
availabilitySchema.index({ teacher: 1, status: 1, startAt: 1 });

export default mongoose.model('Availability', availabilitySchema);
