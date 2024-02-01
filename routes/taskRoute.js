// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Task = require('../models/task');
const Subtask = require('../models/subtask');
const uuid = require('uuid');

// Create Task API
router.post('/create-task', authenticateToken, async (req, res) => {
  try {
    const { title, description, due_date } = req.body;

    // Validate input fields
    if (!title || !description || !due_date) {
      return res.status(400).json({ error: 'Title, description, and due_date are required' });
    }

    // Assuming you have a user ID in the JWT payload
    const user_id = req.user.id;
    // console.log("user id is", user_id);
    // Create a new task
    const task = new Task({
      title,
      description,
      due_date,
      user_id,
    });

    await task.save();

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create Subtask API
router.post('/create-subtask', authenticateToken, async (req, res) => {
    try {
      const { task_id } = req.body;
  
      // Assuming you have the user_id in the JWT payload
      const user_id = req.user.id;
  
      // Create a new subtask associated with the specified task_id
      const id = uuid.v4();
      const subtask = new Subtask({
        id,
        task_id
      });
  
      await subtask.save();
  
      res.status(201).json({ message: 'Subtask created successfully', subtask });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


// Get all users' tasks with filters and pagination

router.get('/user-tasks', async (req, res) => {
    try {
        const { due_date, page, limit } = req.body;

        const query = {};

        if (due_date) {
        // Use a library like moment.js to handle time zones
        const targetDate = new Date(`${due_date}T00:00:00Z`);
        query.due_date = { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) };
        }
        const tasks = await Task.find(query)
        .sort({ priority: 'asc', due_date: 'asc' })
        .skip((page - 1) * limit)
        .limit(limit);
  
      const processedTasks = tasks.map(task => {
        let priority = 3; // Default priority for tasks due 5 days or more in the future
  
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
  
        if (task.due_date <= today) {
          priority = 0;
        } else if (task.due_date <= tomorrow) {
          priority = 1;
        } else if (task.due_date <= dayAfterTomorrow) {
          priority = 2;
        }
  
        return { ...task._doc, priority };
      });
  
      res.json({ tasks: processedTasks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
      
  router.get('/user-sub-tasks', async (req, res) => {
    try {
      const { task_id } = req.body;
  
      const query = {};
  
      if (task_id) {
        query.task_id = task_id; // Filter by task_id if provided
      }
  
      const subTasks = await Subtask.find(query)
        .sort({ priority: 'asc', due_date: 'asc' });
  
      res.json({ subTasks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.put('/update-task/:taskId', async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const { due_date, status } = req.body;
  
      // Validate if either due_date or status is provided
      if (!due_date && !status) {
        return res.status(400).json({ error: 'Provide at least one parameter (due_date or status).' });
      }
  
      const updatedFields = {};
  
      if (due_date) {
        // Update due_date if provided
        updatedFields.due_date = new Date(due_date);
      }
  
      if (status) {
        // Update status if provided and is either "TODO" or "DONE"
        if (status === 'TODO' || status === 'DONE') {
          updatedFields.status = status;
        } else {
          return res.status(400).json({ error: 'Invalid status. Use "TODO" or "DONE".' });
        }
      }
  
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updatedFields },
        { new: true } // Return the updated document
      );
  
      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      // Update the corresponding subtasks
    const subtasks = await Subtask.find({ task_id: taskId });

    subtasks.forEach(async (subtask) => {
      if (status === 'DONE') {
        subtask.status = 1;
      } else if (status === 'TODO') {
        subtask.status = 0;
      }

      // Your subtask update logic goes here
      // Example: subtask.field = updatedValue;
      await subtask.save();
    });
  
      res.json({ updatedTask });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.put('/update-subtask/:subTaskId', async (req, res) => {
    try {
      const subTaskId = req.params.subTaskId;
      const { status } = req.body;
  
      // Validate if status is provided and is either 0 or 1
      if (status === undefined || (status !== 0 && status !== 1)) {
        return res.status(400).json({ error: 'Invalid status. Use 0 or 1.' });
      }
  
      const updatedSubTask = await Subtask.findByIdAndUpdate(
        subTaskId,
        { $set: { status } },
        { new: true } // Return the updated document
      );
  
      if (!updatedSubTask) {
        return res.status(404).json({ error: 'Subtask not found.' });
      }
  
      res.json({ updatedSubTask });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.delete('/delete-task/:taskId', async (req, res) => {
    try {
      const taskId = req.params.taskId;
  
      // Soft delete the task by setting the 'deleted' field to true
      const deletedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: { deleted: true } },
        { new: true } // Return the updated document
      );
  
      if (!deletedTask) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      // Soft delete all corresponding subtasks
    const subtasks = await Subtask.find({ task_id: taskId });

    subtasks.forEach(async (subtask) => {
      // Soft delete the subtask by setting the 'deleted' field to true
      await Subtask.findByIdAndUpdate(
        subtask._id,
        { $set: { deleted: true } },
        { new: true } // Return the updated document
      );
    });
  
      res.json({ message: 'Task deleted successfully.', deletedTask });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.delete('/delete-subtask/:subTaskId', async (req, res) => {
    try {
      const subTaskId = req.params.subTaskId;
  
      // Find the subtask before soft deleting
      const subTaskToDelete = await Subtask.findById(subTaskId);
  
      if (!subTaskToDelete) {
        return res.status(404).json({ error: 'Subtask not found.' });
      }
  
      // Soft delete the subtask by setting the 'deleted' field to true
      const deletedSubTask = await Subtask.findByIdAndUpdate(
        subTaskId,
        { $set: { deleted: true, deleted_at: new Date() } },
        { new: true } // Return the updated document
      );
  
      res.json({ message: 'Subtask deleted successfully.', deletedSubTask });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

module.exports = router;
