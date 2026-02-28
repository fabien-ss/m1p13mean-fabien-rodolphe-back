const express = require('express');
const router = express.Router();
const ProductService = require('../services/ProductService');
const authMiddleware = require('../middleware/auth');
const upload = require("../middleware/upload");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         description:
 *           type: stringProductService
 *         shop:
 *           type: string
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           example: Nike Air Max
 *         price:
 *           type: number
 *           example: 99.99
 *         description:
 *           type: string
 *           example: Great shoes
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 */
router.post('/', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const produit = await ProductService.create(req.body, req.user);
    res.status(201).json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const produits = await ProductService.getAll(req.user);
    res.json(produits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const produit = await ProductService.getById(req.params.id, req.user);
    res.json(produit);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/:id/pricing', authMiddleware(), async (req, res) => {
  try {
    const pricing = await ProductService.getPricing(req.params.id, req.user);
    res.json(pricing);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});


/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 */
router.put('/:id', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const produit = await ProductService.update(req.params.id, req.body, req.user);
    res.json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produit supprimé
 *                 produit:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authMiddleware(['admin', 'shop']), async (req, res) => {
  try {
    const produit = await ProductService.delete(req.params.id, req.user);
    res.json({ message: 'Produit supprimé', produit });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.put('/:id/active', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) throw new Error('isActive is required');

    const produit = await ProductService.setActive(req.params.id, isActive, req.user);
    res.status(200).json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/shop/:shopId', authMiddleware(["admin", "shop"]), async (req, res) => {
  try {
    const products = await ProductService.getByShop(req.params.shopId);
    res.status(200).json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;