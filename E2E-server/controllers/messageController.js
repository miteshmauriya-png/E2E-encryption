const Message = require('../models/message');
const ChatRoom = require('../models/chatRoom');

// Create Message
exports.createMessage = async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const { Participants, type = 'private' } = req.body;
    const currentUserId = req.user?.id; // Make sure you have auth middleware

    if (! Participants || !Array.isArray( Participants)) {
      return res.status(400).json({ 
        success: false, 
        message: "Participants array is required" 
      });
    }
    const allParticipants =  Participants
    let room = await ChatRoom.findOne({
      type: 'private',
      Participants: { $all: allParticipants, $size: allParticipants.length }
    });
    if (!room) {
      room = await ChatRoom.create({
        type: 'private',
        Participants: allParticipants,
        createdBy: currentUserId,
        lastMessageAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      room
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get All Messages
exports.getMessages = async (req, res) => {
  try {
    const { chatRoom } = req.body;

    if (!chatRoom) {
      return res.status(400).json({ 
        success: false, 
        message: "chatRoom ID is required" 
      });
    }

    const messages = await Message.find({ chatRoom })
      .populate({
        path: 'sender',
        select: 'userName email devices', // You can choose fields you need
      })
      .sort({ createdAt: -1 })           // Newest first
      .limit(100);                       // Optional: limit messages

    res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get Single Message
exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Message
exports.updateMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};