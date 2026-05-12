const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false   
  },

  devices: [{
    deviceId: {
      type: String,
      required: true
    },
    deviceName: {
      type: String,
      default: 'Unknown Device'
    },
    publicKey: {
      type: String,
      required: true
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  }],

}, { 
  timestamps: true 
});

// userSchema.index({ email: 1 }, { unique: true });

// userSchema.index({ "devices.deviceId": 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);