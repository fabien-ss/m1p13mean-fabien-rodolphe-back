const express = require('express');
const router = express.Router();
const ShopService = require('../services/ShopService');
const authMiddleware = require('../middleware/auth');
const upload = require("../middleware/upload");

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

router.get('/list', async (req, res) => {
  try {
    const boutiques = await ShopService.getAll();
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
router.get('/:id', async (req, res) => {
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


// POST /shop — créer
router.post('/', authMiddleware(['admin']), upload.array("image"), async (req, res) => {
  try {
    const imageUrls = req.files?.map(file => `/uploads/${file.filename}`) ?? [];
    const shop = await ShopService.create(req.body, imageUrls);
    res.status(201).json(shop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// PUT /shop/:id — update
router.put('/:id', authMiddleware(['admin']), upload.array("image"), async (req, res) => {
  try {
    // Si de nouvelles images sont envoyées, on les ajoute
    // Sinon on garde les images existantes (pas d'écrasement)
    const data = { ...req.body };

    if (req.files && req.files.length > 0) {
      data.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const shop = await ShopService.update(req.params.id, data, req.user);
    res.json(shop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /shop/:id/deactivate — soft delete
router.patch('/:id/deactivate', authMiddleware(), async (req, res) => {
  try {
    const shop = await ShopService.deactivate(req.params.id, req.user);
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;