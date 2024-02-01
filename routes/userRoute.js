// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to validate request data and check for existing phone number
const validateUserData = async (req, res, next) => {
  const { phoneNumber, priority } = req.body;

  if (!phoneNumber || !priority) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if the user already exists with the given phone number
  const existingUser = await User.findOne({ phoneNumber });
  if (existingUser) {
    return res.status(400).json({ error: 'User with this phone number already exists' });
  }

  next();
};

// Create User API
router.post('/create-user', validateUserData, async (req, res) => {
  try {
    const { phoneNumber, priority } = req.body;

    // Generate a unique user ID using uuid
    const id = uuid.v4();

    // Create a new user
    const user = new User({
      id,
      phoneNumber,
      priority,
    });

    await user.save();

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login API using unique id
router.post('/login', async (req, res) => {
    const { id } = req.body;
  
    try {
      // Search for a user in the database based on the provided id
      const user = await User.findOne({ id });
  
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Create a JWT token with a one-day expiry
      const token = jwt.sign({ id: user._id}, process.env.SECRET_KEY, {
        expiresIn: '1d',
      });
  
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = router;
