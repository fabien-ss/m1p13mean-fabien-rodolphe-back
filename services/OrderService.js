const Order = require('../models/Order');
const mongoose = require('mongoose');

class OrderService {

    static async listOrdersByShop(shopId, startDate, endDate) {
        // add date filtering if startDate and endDate are provided
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        const orders = await Order.find()
            .where('creationDate').gte(dateFilter.$gte).lte(dateFilter.$lte)
            .populate({
                path: 'products.produit',
                match: { shop: new mongoose.Types.ObjectId(shopId) },
                select: 'shop'
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
                channel: 'Online',
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
}

module.exports = OrderService;