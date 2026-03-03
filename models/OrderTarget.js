// models/OrderTarget.js
const mongoose = require('mongoose');

const monthlyTargetSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  targetOrders: { type: Number, required: true }
}, { _id: false });

const orderTargetSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  monthlyTargets: {
    type: [monthlyTargetSchema],
    validate: v => v.length === 12
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrderTarget', orderTargetSchema);