// routes/auth.js
const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const authMiddleware = require('../middlewares/auth');

router.post('/register', async (req, res) => {
  try {
    const result = await UserService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await UserService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/users', authMiddleware(['admin']),async (req, res) => {
    try {
      const result = await UserService.getAll();
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

module.exports = router;
