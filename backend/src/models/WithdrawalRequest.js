const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 5000 },
    type: { type: String, enum: ["UPI", "Bank"], required: true },
    details: {
      upiId: { type: String },
      bankDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        ifsc: { type: String },
      },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
