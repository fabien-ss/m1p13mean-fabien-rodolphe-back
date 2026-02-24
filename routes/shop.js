const express = require('express');
const router = express.Router();
const ShopService = require('../services/ShopService');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Shop management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Shop:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         owner:
 *           type: string
 *     ShopInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: My Shop
 *         address:
 *           type: string
 *           example: 123 Main Street
 */

/**
 * @swagger
 * /shop:
 *   post:
 *     summary: Create a new shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShopInput'
 *     responses:
 *       201:
 *         description: Shop created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shop'
 *       400:
 *         description: Bad request
 */
router.post('/', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const boutique = await ShopService.create(req.body);
    res.status(201).json(boutique);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /shop:
 *   get:
 *     summary: Get all shops
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all shops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Shop'
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const boutiques = await ShopService.getAll(req.user);
    console.log(boutiques)
    res.json(boutiques);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const boutiques = await ShopService.getFeaturedShops(6);
    res.json(boutiques);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /shop/{id}:
 *   get:
 *     summary: Get a shop by ID
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shop'
 *       404:
 *         description: Shop not found
 */
router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const boutique = await ShopService.getById(req.params.id);
    console.log(boutique)
    res.json(boutique);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * 69a2ae288803df1eeef59595
 * @swagger
 * /shop/{id}:
 *   put:
 *     summary: Update a shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShopInput'
 *     responses:
 *       200:
 *         description: Shop updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shop'
 *       400:
 *         description: Bad request
 */
router.put('/:id', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const boutique = await ShopService.update(req.params.id, req.body);
    res.json(boutique);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /shop/{id}:
 *   delete:
 *     summary: Delete a shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Boutique supprimée
 *                 boutique:
 *                   $ref: '#/components/schemas/Shop'
 *       404:
 *         description: Shop not found
 */
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const boutique = await ShopService.delete(req.params.id);
    res.json({ message: 'Boutique supprimée', boutique });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;