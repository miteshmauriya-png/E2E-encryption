
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Register User
exports.createUser = async (req, res) => {
  try {
    const { userName, email, password, devices } = req.body;

    // Validation
    if (!userName || !email || !password) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Please provide userName, email and password' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        status: 'fail', 
        message: 'User with this email already exists' 
      });
    }
    const newUser = await User.create({
      userName,
      email: email.toLowerCase(),
      password: password,
      devices: devices || []   // devices array should come from frontend
    });

    // Remove password from response
    newUser.password = undefined;

    // Generate JWT Token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: newUser
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId, publicKey, deviceName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (password !== user.password) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password'
      });
    }

    // Optional: Update device info if provided
    if (deviceId && publicKey) {
      const deviceExists = user.devices.some(d => d.deviceId === deviceId);
      
      if (!deviceExists) {
        user.devices.push({
          deviceId,
          deviceName: deviceName || 'Unknown Device',
          publicKey,
          lastActive: Date.now()
        });
        await user.save();
      } else {
        // Update last active
        await User.updateOne(
          { "devices.deviceId": deviceId },
          { $set: { "devices.$.lastActive": Date.now() } }
        );
      }
    }

    // Remove password
    user.password = undefined;

    // Generate Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during login'
    });
  }
};


exports.getUsers = async (req, res) => {
  try {
    const messages = await User.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};