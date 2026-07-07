// src/lib/models/Task.ts
import mongoose, { Schema, model, models } from 'mongoose';

const SubTaskSchema = new Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  completedAt: { type: Date },
});

const TaskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    deadline: { type: Date },
    subTasks: [SubTaskSchema],
    tags: [{ type: String }],
    completedAt: { type: Date },
    totalExpenses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Task = models.Task || model('Task', TaskSchema);
