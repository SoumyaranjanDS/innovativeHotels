const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['pending', 'partially_verified', 'verified', 'rejected', 'active'], default: 'pending' },
  hotelService: {
    status: { type: String, enum: ['draft', 'pending_review', 'correction_required', 'approved', 'rejected', 'suspended', 'active'], default: 'draft' },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }
  },
  cabService: {
    status: { type: String, enum: ['draft', 'pending_review', 'correction_required', 'approved', 'rejected', 'suspended', 'active'], default: 'draft' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'CabVendor' }
  },
  payoutMethods: {
    upiId: { type: String },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      ifsc: { type: String }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
