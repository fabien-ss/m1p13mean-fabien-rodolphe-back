var express = require('express');
var router = express.Router();
const UserService = require('../services/UserService');
const authMiddleware = require('../middleware/auth');

// GET all users
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const users = await UserService.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user by ID
router.get('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await UserService.getById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST create user
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const result = await UserService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await UserService.update(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH deactivate
router.patch('/:id/deactivate', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await UserService.deactivate(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH activate
router.patch('/:id/activate', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await UserService.activate(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH reset password
router.patch('/:id/reset-password', authMiddleware(['admin']), async (req, res) => {
  try {
    const result = await UserService.resetPassword(req.params.id, req.body.password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;