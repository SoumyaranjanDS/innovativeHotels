const mongoose = require('mongoose');

const cabFareRuleSchema = new mongoose.Schema({
  vehicleType: { type: String, required: true }, // e.g., Mini, Sedan, SUV
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, if rules are provider-specific
  baseFare: { type: Number, required: true },
  perKmRate: { type: Number, required: true },
  perMinuteRate: { type: Number, default: 0 },
  minimumFare: { type: Number, required: true },
  nightCharge: { type: Number, default: 0 },
  waitingCharge: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  platformCommissionType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  platformCommissionValue: { type: Number, default: 10 }, // e.g., 10%
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CabFareRule', cabFareRuleSchema);
