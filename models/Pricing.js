// models/pricing.js
const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null }, // null = currently active
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('pricing', pricingSchema);