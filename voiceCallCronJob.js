// voiceCallCronJob.js
const cron = require('node-cron');
const Task = require('./models/task');
const User = require('./models/user');
const twilio = require('twilio');

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTHTOKEN;
const client = new twilio(accountSid, authToken);

const callUser = async (user) => {
    try {
      // Use client.calls.create() to initiate a voice call
      await client.calls.create({
        twiml: `<Response><Say>Hello ${user.id}. This is a voice call from your application.</Say></Response>`,
        to: user.phone,
        // from: 'your_twilio_phone_number', // Your Twilio phone number
        from: '+16592175551', // Your Twilio phone number
      });
  
      console.log(`Calling user ${user.id} at ${user.phone}`);
    } catch (error) {
      console.error('Error making Twilio voice call:', error);
    }
  };

cron.schedule('0 * * * *', async () => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get tasks that passed their due_date
    const overdueTasks = await Task.find({
      due_date: { $lt: today },
    });

    for (const task of overdueTasks) {
      // Get the user associated with the task
      const user = await User.findById(task.user_id);

      if (user) {
        // Call the user based on priority
        await callUser(user);
      }
    }
  } catch (error) {
    console.error('Error in voice calling cron job:', error);
  }
});
