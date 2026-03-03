// models/MonthlyObjective.js
const mongoose = require('mongoose');

const monthlyObjectiveSchema = new mongoose.Schema({
  shopId:      { type: mongoose.Schema.Types.ObjectId, ref: 'shop', required: true },
  monthIndex:  { type: Number, required: true, min: 0, max: 11 },
  targetValue: { type: Number, required: true },
});

monthlyObjectiveSchema.index({ shopId: 1, monthIndex: 1 }, { unique: true });

module.exports = mongoose.model('monthlyObjective', monthlyObjectiveSchema);