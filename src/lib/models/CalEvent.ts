// src/lib/models/CalEvent.ts
import mongoose, { Schema } from 'mongoose';

const CalEventSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  date:        { type: Date, required: true },
  startTime:   { type: String, default: '' },  // "09:00"
  endTime:     { type: String, default: '' },  // "10:00"
  type: {
    type: String,
    enum: ['errand', 'meeting', 'mentor-session', 'personal', 'deadline', 'booking'],
    default: 'personal',
  },
  color:       { type: String, default: '#d97757' },
  allDay:      { type: Boolean, default: false },
  recurring:   { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  location:    { type: String, default: '' },
  bookedBy:    { type: Schema.Types.ObjectId, ref: 'User', default: null }, // for booking slots
  status:      { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
}, { timestamps: true });

export const CalEvent = mongoose.models.CalEvent || mongoose.model('CalEvent', CalEventSchema);
