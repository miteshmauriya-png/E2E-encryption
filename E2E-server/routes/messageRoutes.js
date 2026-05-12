const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage, getRoom
} = require('../controllers/messageController');

router.post('/', createMessage);
router.post('/get-or-create', getRoom);
router.post('/get-by-room', getMessages);
router.get('/:id', getMessage);
router.put('/:id', updateMessage);
router.delete('/:id', deleteMessage);

module.exports = router;