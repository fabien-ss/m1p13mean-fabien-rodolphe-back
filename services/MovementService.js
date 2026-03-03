const ProductMovement = require('../models/ProductMovement');
const Product = require('../models/Product');
const Pricing = require('../models/Pricing');

class MovementService {

    static async getByShop(shopId, type = null) {
        // First get all product IDs belonging to the shop
        const products = await Product.find({ shop: shopId }, '_id');
        const productIds = products.map(p => p._id);

        const query = { product: { $in: productIds } };
        if (type && type !== 'all') query.type = type;

        // need cost pricing, selling pricing, margin and expiridate from princing table
        /*
            For each movement, we want to include:
            const currentPricing = await Pricing.findOne({
                    product: product._id,
                    startDate: { $lte: new Date() },
                    $or: [
                      { endDate: { $gte: new Date() } },
                      { endDate: null }
                    ]
                  }).sort({ createdAt: -1 });
    
        */
        const productMovements = await ProductMovement.find(query)
            .populate('product', 'name sku images')
            .populate('createdBy', 'prenom nom')
            .sort({ date: -1 });

        // For each movement, we want to include the current pricing details
        const movementsWithPricing = await Promise.all(productMovements.map(async (movement) => {
            const currentPricing = await Pricing.findOne({
                product: movement.product._id,
                startDate: { $lte: new Date() },
                $or: [
                    { endDate: { $gte: new Date() } },
                    { endDate: null }
                ]
            }).sort({ createdAt: -1 });

            return {
                ...movement.toObject(),
                costPrice: currentPricing ? currentPricing.costPrice : null,
                sellingPrice: currentPricing ? currentPricing.sellingPrice : null,
                margin: currentPricing ? (currentPricing.sellingPrice - currentPricing.costPrice) : null,
                expiryDate: currentPricing ? currentPricing.endDate : null
            }
        }));

        return movementsWithPricing;
    }

    static async getByProduct(productId, type = null) {
        const query = { product: productId };
        if (type && type !== 'all') query.type = type;

        return ProductMovement.find(query)
            .populate('product', 'name sku images')
            .populate('createdBy', 'prenom nom')
            .sort({ date: -1 });
    }

    static async create(data, user) {
        const { product, type, quantity, reason } = data;
        const movement = new ProductMovement({ product, type, quantity, reason, createdBy: user.id });
        await movement.save();
        return movement;
    }

    static async delete(id) {
        const movement = await ProductMovement.findByIdAndDelete(id);
        if (!movement) throw new Error('Movement not found');
        return movement;
    }

    static async createStockEntry(data, user) {
        const { product, quantity, costPrice, sellingPrice, expiryDate, reason } = data;

        if (!product) throw new Error('Product is required');
        if (!quantity || quantity <= 0) throw new Error('Quantity must be greater than 0');

        const movement = new ProductMovement({
            product,
            type: 'in',
            quantity,
            reason: reason ?? 'stock entry',
            createdBy: user.id
        });
        await movement.save();

        // Update product stock
        await Product.findByIdAndUpdate(product, { $inc: { stock: quantity } });

        return movement;
    }
}

module.exports = MovementService;