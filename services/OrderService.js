const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

class OrderService {

    static async listOrdersByShop(shopId, startDate, endDate) {
        const query = Order.find();

        console.log('Listing orders for shop:', shopId, 'with date range:', startDate, 'to', endDate);

        if (startDate) query.where('creationDate').gte(new Date(startDate));
        if (endDate) query.where('creationDate').lte(new Date(endDate));

        const orders = await query
            .populate({
                path: 'products.produit',
                match: { shop: new mongoose.Types.ObjectId(shopId) },
                select: 'shop name'
            })
            .populate('client', 'name email')
            .sort({ creationDate: -1 })
            .lean();

        return orders
            .map(order => ({
                ...order,
                products: order.products.filter(p => p.produit !== null)
            }))
            .filter(order => order.products.length > 0)
            .map(order => ({
                id: order._id,
                channel: order.channel ?? 'Online',
                customer: {
                    name: order.client?.name ?? 'Unknown',
                    email: order.client?.email ?? ''
                },
                itemCount: order.products.reduce((sum, p) => sum + p.quantite, 0),
                total: order.total,
                status: order.statut,
                date: order.creationDate
            }));
    }

    /**
     * Récupère les produits disponibles d'une boutique (pour le formulaire)
     */
    static async getShopProducts(shopId) {
        const products = await Product.find({
            shop: new mongoose.Types.ObjectId(shopId),
            available: true,
            stock: { $gt: 0 }
        }).select('name stock devise price').lean();

        return products.map(p => ({
            id: p._id,
            name: p.name,
            stock: p.stock,
            devise: p.devise ?? 'MGA',
            price: p.price ?? 0
        }));
    }

    /**
     * Recherche des clients par nom ou email (pour l'autocomplete)
     */
    static async searchClients(query) {
        const regex = new RegExp(query, 'i');
        const users = await User.find({
            isActive: true,
            $or: [{ name: regex }, { email: regex }, { firstName: regex }]
        }).select('name firstName email').limit(10).lean();

        return users.map(u => ({
            id: u._id,
            name: `${u.firstName} ${u.name}`.trim(),
            email: u.email
        }));
    }

    /**
     * Crée une commande en boutique
     * @param {string} clientId
     * @param {Array<{produitId: string, quantite: number, prix: number}>} items
     * @param {string} shopId
     */
    static async createOrder(clientId, items, shopId) {
        if (!items || items.length === 0) {
            throw new Error('La commande doit contenir au moins un produit.');
        }

        const productIds = items.map(i => new mongoose.Types.ObjectId(i.produitId));
        const products = await Product.find({
            _id: { $in: productIds },
            shop: new mongoose.Types.ObjectId(shopId),
            available: true
        }).lean();

        if (products.length !== items.length) {
            throw new Error("Un ou plusieurs produits sont invalides ou n'appartiennent pas à cette boutique.");
        }

        let total = 0;
        const orderProducts = [];

        for (const item of items) {
            const product = products.find(p => p._id.toString() === item.produitId);
            if (!product) throw new Error(`Produit ${item.produitId} introuvable.`);
            if (product.stock < item.quantite) {
                throw new Error(`Stock insuffisant pour "${product.name}". Disponible : ${product.stock}`);
            }
            total += item.prix * item.quantite;
            orderProducts.push({ produit: item.produitId, quantite: item.quantite });
        }

        // Décrémenter le stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.produitId, {
                $inc: { stock: -item.quantite }
            });
        }

        const order = await Order.create({
            client: clientId,
            products: orderProducts,
            total,
            statut: 'pending',
            channel: 'In-Store'
        });

        const populated = await order.populate([
            { path: 'client', select: 'name firstName email' },
            { path: 'products.produit', select: 'name' }
        ]);

        return {
            id: populated._id,
            channel: 'In-Store',
            customer: {
                name: populated.client?.name ?? 'Unknown',
                email: populated.client?.email ?? ''
            },
            itemCount: populated.products.reduce((sum, p) => sum + p.quantite, 0),
            total: populated.total,
            status: populated.statut,
            date: populated.creationDate
        };
    }

    /**
     * Met à jour le statut d'une commande
     * @param {string} orderId
     * @param {string} newStatus
     */
    static async updateOrderStatus(orderId, newStatus) {
        const allowed = ['pending', 'in progress', 'delivered', 'cancelled'];
        if (!allowed.includes(newStatus)) {
            throw new Error(`Statut invalide. Valeurs autorisées : ${allowed.join(', ')}`);
        }

        const order = await Order.findById(orderId);
        if (!order) throw new Error('Commande introuvable.');

        if (order.statut === 'delivered' || order.statut === 'cancelled') {
            throw new Error('Impossible de modifier une commande déjà livrée ou annulée.');
        }

        // Restituer le stock si annulation
        if (newStatus === 'cancelled') {
            for (const item of order.products) {
                await Product.findByIdAndUpdate(item.produit, {
                    $inc: { stock: item.quantite }
                });
            }
        }

        order.statut = newStatus;
        await order.save();

        return { id: order._id, status: order.statut };
    }
}

module.exports = OrderService;