// models/Commande.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: false },
  isActive: { type: Boolean, default: true },
  creationDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('category', categorySchema);
