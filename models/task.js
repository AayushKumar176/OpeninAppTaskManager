// models/taskModel.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  due_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'DONE'],
    default: 'TODO',
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // Assuming user_id is an ObjectId
    ref: 'User', // Reference to the User model
    required: true,
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

// Add a pre-update middleware to handle subtask updates
taskSchema.pre('updateOne', async function () {
    const task = await this.model.findOne(this.getQuery());
  
    if (task) {
      // Update subtask status based on the task status
      const subtasks = await mongoose.model('SubTask').find({ task_id: task._id });
  
      if (subtasks.length > 0) {
        const isAllSubtasksDone = subtasks.every(subtask => subtask.status === 'DONE');
        const isAnySubtaskInProgress = subtasks.some(subtask => subtask.status === 'IN_PROGRESS');
  
        if (isAllSubtasksDone) {
          task.status = 'DONE';
        } else if (isAnySubtaskInProgress) {
          task.status = 'IN_PROGRESS';
        } else {
          task.status = 'TODO';
        }
  
        await task.save();
      }
    }
  });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

