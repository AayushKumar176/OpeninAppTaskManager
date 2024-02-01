// taskCronJob.js
const cron = require('node-cron');
const Task = require('./models/task');

cron.schedule('0 0 * * *', async () => {
  try {
    // Get tasks that are due today
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tasksToUpdate = await Task.find({
      due_date: { $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    // Update priority based on your logic
    tasksToUpdate.forEach(async (task) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
      
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
      
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
      
        if (task.due_date <= today) {
          task.priority = 0;
        } else if (task.due_date <= tomorrow) {
          task.priority = 1;
        } else if (task.due_date <= dayAfterTomorrow) {
          task.priority = 2;
        } else {
          task.priority = 3; // Default priority for tasks due 5 days or more in the future
        }
      
        await task.save();
      });
      
  } catch (error) {
    console.error('Error in task priority cron job:', error);
  }
});
