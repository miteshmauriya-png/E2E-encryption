const express = require('express');
const router = express.Router();
const {
  createUser,
  login, getUsers
} = require('../controllers/user.controller');

router.post('/register', createUser);
router.post('/login', login);
router.get('/users', getUsers);

module.exports = router;