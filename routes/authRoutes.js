// routes/authRoutes.js - Saari auth routes yahan ayengi

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes (bina token ke access kar sakte hain)
router.post('/register', register);
router.post('/login', login);

// Private route (token chahiye)
router.get('/me', authMiddleware, getMe);

module.exports = router;