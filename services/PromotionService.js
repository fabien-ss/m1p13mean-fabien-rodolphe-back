// services/promotion.service.js
const Promotion = require("../models/Promotion");

class PromotionService {

    static async getBestCurrentByProduct(productId, price, at = new Date()) {
        const promos = await Promotion.find({
            product: productId,
            startDate: { $lte: at },
            $or: [{ endDate: null }, { endDate: { $gte: at } }],
        });

        let bestPromo = null;
        let bestAmount = 0;

        for (const promo of promos) {
            const { discountAmount } = this.calcFinalPrice(price, promo);
            if (discountAmount > bestAmount) {
                bestAmount = discountAmount;
                bestPromo = promo;
            }
        }

        return bestPromo; // peut être null
    }

    // Historique promos d’un produit
    static async getByProduct(productId) {
        return await Promotion.find({ product: productId }).sort({ startDate: -1 });
    }

    // Calcul du prix final
    static calcFinalPrice(originalPrice, promoDoc) {
        const oldPrice = Number(originalPrice) || 0;

        if (!promoDoc) {
            return { price: oldPrice, oldPrice, promo: false, discountAmount: 0, discountPercent: 0 };
        }

        let discountAmount = 0;

        if (promoDoc.discountType === "PERCENT") {
            discountAmount = oldPrice * (Number(promoDoc.value) / 100);
        } else {
            discountAmount = Number(promoDoc.value);
        }

        discountAmount = Math.max(0, Math.min(discountAmount, oldPrice));
        const price = Math.max(0, oldPrice - discountAmount);
        const discountPercent = oldPrice > 0 ? Math.round((discountAmount / oldPrice) * 100) : 0;

        return { price, oldPrice, promo: discountAmount > 0, discountAmount, discountPercent };
    }

    // Créer une promo
    static async create(data, user) {
        const promo = new Promotion({
            product: data.product,
            title: data.title,
            description: data.description ?? "",
            discountType: data.discountType,
            value: data.value,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            createdBy: user.id,
        });

        return await promo.save();
    }

    // Enrichir 1 produit (detail)
    static async applyToProduct(product) {
        // choisir la meilleure promo active (selon ta règle "promo la plus élevée")
        const promos = await Promotion.find({
            product: product._id,
            startDate: { $lte: new Date() },
            $or: [{ endDate: null }, { endDate: { $gte: new Date() } }],
        });

        let best = null; // best promotion
        let bestAmount = 0; // best discount amount

        for (const pr of promos) {
            const { discountAmount } = this.calcFinalPrice(product.price, pr);
            if (discountAmount > bestAmount) {
                bestAmount = discountAmount;
                best = pr;
            }
        }

        const pricing = this.calcFinalPrice(product.price, best);

        return {
            ...(product.toObject?.() ?? product),

            price: pricing.price,
            oldPrice: pricing.oldPrice,
            promo: pricing.promo,
            discountAmount: pricing.discountAmount,
            discountPercent: pricing.discountPercent,
        };
    }

    // Enrichir une liste (catalogue) en 1 seule requête promo
    static async applyToProducts(products) {
        const ids = products.map(p => p._id);
        const now = new Date();

        const promos = await Promotion.find({
            product: { $in: ids },
            startDate: { $lte: now },
            $or: [{ endDate: null }, { endDate: { $gte: now } }],
        });

        // group promos by product
        const promosByProduct = new Map();
        for (const pr of promos) {
            const key = pr.product.toString();
            if (!promosByProduct.has(key)) promosByProduct.set(key, []);
            promosByProduct.get(key).push(pr);
        }

        return products.map(p => {
            const list = promosByProduct.get(p._id.toString()) || [];

            // best promo = biggest discountAmount
            let best = null;
            let bestAmount = 0;

            for (const pr of list) {
                const { discountAmount } = this.calcFinalPrice(p.price, pr);
                if (discountAmount > bestAmount) {
                    bestAmount = discountAmount;
                    best = pr;
                }
            }

            const pricing = this.calcFinalPrice(p.price, best);

            return {
                ...(p.toObject?.() ?? p),
                price: pricing.price,
                oldPrice: pricing.oldPrice,
                promo: pricing.promo,
                discountAmount: pricing.discountAmount,
                discountPercent: pricing.discountPercent,
            };
        });
    }

    static async getHotDeals({ limit = 8, minDiscountPercent = 10, now = new Date() } = {}) {

        const promos = await Promotion.find({
            startDate: { $lte: now },
            $or: [{ endDate: null }, { endDate: { $gte: now } }],
        }).populate('product', 'name price images brand devise stock available');

        // filtrer les produits indisponibles ou sans stock
        const validPromos = promos.filter(promo =>
            promo.product &&
            promo.product.available &&
            promo.product.stock > 0
        );

        // calculer le prix final pour chaque promo et filtrer par minDiscountPercent
        const deals = validPromos
            .map(promo => {
                const pricing = this.calcFinalPrice(promo.product.price, promo);
                return {
                    promotion: promo,
                    product: {
                        ...promo.product.toObject(),
                        price: pricing.price,
                        oldPrice: pricing.oldPrice,
                        discountAmount: pricing.discountAmount,
                        discountPercent: pricing.discountPercent,
                        promo: pricing.promo,
                    },
                };
            })
            .filter(deal => deal.product.discountPercent >= minDiscountPercent);

        // garder que la meilleure promos
        const bestPerProduct = new Map();
        for (const deal of deals) {
            const key = deal.product._id.toString();
            const existing = bestPerProduct.get(key);
            if (!existing || deal.product.discountAmount > existing.product.discountAmount) {
                bestPerProduct.set(key, deal);
            }
        }

        return [...bestPerProduct.values()]
            .sort((a, b) => b.product.discountAmount - a.product.discountAmount)
            .slice(0, limit)
            .map(deal => deal.product);
    }
}


module.exports = PromotionService;