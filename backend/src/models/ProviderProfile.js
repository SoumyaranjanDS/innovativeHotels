const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['pending', 'partially_verified', 'verified', 'rejected'], default: 'pending' },
  hotelService: {
    status: { type: String, enum: ['draft', 'pending_review', 'correction_required', 'approved', 'rejected', 'suspended'], default: 'draft' },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }
  },
  cabService: {
    status: { type: String, enum: ['draft', 'pending_review', 'correction_required', 'approved', 'rejected', 'suspended'], default: 'draft' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'CabVendor' }
  }
}, { timestamps: true });

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
