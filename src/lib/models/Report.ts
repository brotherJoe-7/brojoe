// src/lib/models/Report.ts
import mongoose, { Schema, model, models } from 'mongoose';

const ReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'daily' },
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    summary: { type: String, default: '' },
    aiInsights: { type: String, default: '' },
    expenseSnapshot: { type: Schema.Types.Mixed },
    taskSnapshot: { type: Schema.Types.Mixed },
    sharedWith: [{ type: String }],
    shareToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export const Report = models.Report || model('Report', ReportSchema);
