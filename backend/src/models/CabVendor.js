const mongoose = require('mongoose');

const cabVendorSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorDetails: {
    driverName: String,
    fleetCompanyName: String,
    mobile: String,
    email: String,
    address: String,
    emergencyContact: String
  },
  documents: {
    drivingLicense: String,
    driverId: String,
    bankDetails: {
      accountHolder: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String
    }
  },
  serviceAreas: [{
    city: String,
    pickupZones: [String],
    dropZones: [String]
  }],
  availability: {
    isOnline: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true } // available for new rides
  },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  lastLocationUpdatedAt: Date,
  isApproved: { type: Boolean, default: false },
  serviceStatus: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
}, { timestamps: true });

cabVendorSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('CabVendor', cabVendorSchema);
