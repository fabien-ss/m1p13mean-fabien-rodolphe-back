// models/Boutique.js
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  email: { type: String },
  phone: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }, // profil shop
  creationDate: { type: Date, default: Date.now },
  type: { type: String },
  location: { type: String },
  images: [{ type: String }],
  isActive: { type: Boolean, default: false },
  // Add to shopSchema in models/Boutique.js
  monthlyTarget: { type: Number, default: 0 },
  salesOverrides: { type: Map, of: new mongoose.Schema({ sales: Number, revenue: Number }) },
});

module.exports = mongoose.model('shop', shopSchema);
