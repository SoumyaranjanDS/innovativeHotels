const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CabVendor",
      required: true,
    },
    cabSourceType: {
      type: String,
      enum: ["HOTEL_LINKED", "INDEPENDENT"],
      default: "INDEPENDENT",
    },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    details: {
      vehicleType: String, // Sedan, SUV, Hatchback
      model: String,
      year: Number,
      registrationNumber: { type: String, required: true, unique: true },
      seatingCapacity: Number,
      luggageCapacity: Number,
      isAC: Boolean,
      fuelType: String,
      color: String,
      photos: [String],
    },
    documents: {
      rc: String,
      insurance: String,
      permit: String,
      fitnessCertificate: String,
      pollutionCertificate: String,
    },
    fareSetup: {
      baseFare: Number,
      perKmCharge: Number,
      perHourCharge: Number,
      nightCharge: Number,
      waitingCharge: Number,
    },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
