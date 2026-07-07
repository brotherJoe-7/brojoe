// src/lib/models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'mentor', 'admin', 'assistant', 'accountant'], default: 'user' },
    avatar: { type: String, default: '' },
    mentorEmail: { type: String, default: '' },
    gdprConsent: { type: Boolean, default: false },
    gdprConsentDate: { type: Date },
    totalBudget: { type: Number, default: 0 },
    mentorBudget: { type: Number, default: 0 },
    calLink: { type: String, default: '' },
    achievements: [{ type: String }],
  },
  { timestamps: true }
);

export const User = models.User || model('User', UserSchema);
