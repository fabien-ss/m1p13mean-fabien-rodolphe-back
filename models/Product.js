// models/product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  devise: { type: String, default: 'MGA' },
  stock: { type: Number, default: 0 },
  brand: { type: String },
  barcode: { type: String, unique: true },
  sku: { type: String, unique: true },
  model: { type: String },
  available: { type: Boolean, default: true },
  images: [{ type: String }],
  category: { type: String },
  tags: [{ type: String }],
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'shop', required: true },
  creationDate: { type: Date, default: Date.now },
  modificationDate: { type: Date, default: Date.now },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('product', productSchema);