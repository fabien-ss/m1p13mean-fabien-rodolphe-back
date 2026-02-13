const Pricing = require('../models/Pricing');

class PricingService {

  static async getByProduct(productId) {
    return Pricing.find({ product: productId })
      .populate('createdBy', 'prenom nom')
      .sort({ startDate: -1 });
  }

  static async create(data, user) {
    const { product, costPrice, sellingPrice, startDate, endDate, note } = data;

    if (!product) throw new Error('Product is required');
    if (!sellingPrice) throw new Error('Selling price is required');

    // Close current active pricing
    await Pricing.findOneAndUpdate(
      { product, endDate: null },
      { endDate: startDate ?? new Date() }
    );

    const pricing = new Pricing({
      product,
      costPrice: costPrice ?? 0,
      sellingPrice,
      startDate: startDate ?? new Date(),
      endDate: endDate ?? null,
      createdBy: user.id,
        note: note ?? ''
    });

    await pricing.save();
    return pricing;
  }
}

module.exports = PricingService;