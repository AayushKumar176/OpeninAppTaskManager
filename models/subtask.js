// models/subtaskModel.js
const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
      },
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deleted_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Subtask = mongoose.model('Subtask', subtaskSchema);

module.exports = Subtask;
