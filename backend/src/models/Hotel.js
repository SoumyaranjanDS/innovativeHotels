const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerDetails: {
    ownerName: String,
    mobile: String,
    email: String,
    businessType: String,
    address: String,
    city: String,
    state: String,
    country: String
  },
  profile: {
    hotelName: String,
    category: String,
    starRating: Number,
    description: String,
    amenities: [String],
    nearbyPlaces: [String],
    checkInTime: String,
    checkOutTime: String
  },
  policies: {
    cancellation: String,
    refundRules: String,
    childPolicy: String,
    idProofRequired: String,
    petSmokingRules: String
  },
  documents: {
    ownerIdProof: String,
    propertyPhotos: [String],
    businessRegistration: String,
    propertyProof: String,
    bankDetails: {
      accountHolder: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      payoutPreference: String
    }
  },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
