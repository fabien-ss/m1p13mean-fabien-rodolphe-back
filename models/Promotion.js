// models/Promotion.js
const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    discountType: {
      type: String,
      enum: ["PERCENT", "FIXED"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, default: null, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("promotion", promotionSchema);