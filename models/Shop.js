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
  images: [{ type: String }],
  isActive: { type: Boolean, default: false }
});

module.exports = mongoose.model('shop', shopSchema);
