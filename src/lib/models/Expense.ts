// src/lib/models/Expense.ts
import mongoose, { Schema, model, models } from 'mongoose';

const ExpenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    vendor: { type: String, default: '' },
    category: {
      type: String,
      enum: ['transport', 'food', 'supplies', 'accommodation', 'communication', 'miscellaneous'],
      default: 'miscellaneous',
    },
    fundSource: { type: String, enum: ['personal', 'mentor'], default: 'personal' },
    date: { type: Date, default: Date.now },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    tags: [{ type: String }],
    errandId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
  },
  { timestamps: true }
);

export const Expense = models.Expense || model('Expense', ExpenseSchema);
