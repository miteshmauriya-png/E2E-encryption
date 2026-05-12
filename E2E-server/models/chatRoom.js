const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
   Participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  }

}, { 
  timestamps: true 
});

// Indexes for better performance
chatRoomSchema.index({ members: 1 });
chatRoomSchema.index({ type: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);