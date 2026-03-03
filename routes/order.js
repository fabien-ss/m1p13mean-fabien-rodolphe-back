const express = require('express');
const router = express.Router();
const OrderService = require('../services/OrderService');

// GET /api/orders/shop/:shopId?startDate=&endDate=
router.get('/shop/:shopId', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(req)
        const orders = await OrderService.listOrdersByShop(req.params.shopId, startDate, endDate);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/orders/shop/:shopId/products
router.get('/shop/:shopId/products', async (req, res) => {
    try {
        const products = await OrderService.getShopProducts(req.params.shopId);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// api pour recuperer les commandes d'un client
router.get('/client/:clientId', async (req, res) => {
    try {
        const orders = await OrderService.listOrdersByClient(req.params.clientId);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/orders/clients/search?q=
router.get('/clients/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.json([]);
        const clients = await OrderService.searchClients(q.trim());
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/orders
// Body: { clientId, items: [{ produitId, quantite, prix }] }
router.post('/', async (req, res) => {
    try {
        const { clientId, items } = req.body;
        if (!clientId || !items?.length) {
            return res.status(400).json({ message: 'clientId et items sont requis.' });
        }
        const order = await OrderService.createOrder(clientId, items);
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH /api/orders/:orderId/status
// Body: { status: 'pending' | 'in progress' | 'delivered' | 'cancelled' }
router.put('/:orderId/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: 'Le champ status est requis.' });
        const updated = await OrderService.updateOrderStatus(req.params.orderId, status, req.user);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;