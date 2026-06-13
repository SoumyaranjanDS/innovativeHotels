const User = require('../models/User');
const Hotel = require('../models/Hotel');
const CabVendor = require('../models/CabVendor');
const PlatformFee = require('../models/PlatformFee');

exports.getDashboardStats = async (req, res) => {
  try {
    const unapprovedHotels = await Hotel.find({ isApproved: false }).populate('providerId', 'firstName lastName email');
    const unapprovedCabs = await CabVendor.find({ isApproved: false }).populate('providerId', 'firstName lastName email');
    const pendingFees = await PlatformFee.find({ status: 'pending' }).populate('providerId', 'firstName lastName');

    res.json({
      success: true,
      data: {
        unapprovedHotels,
        unapprovedCabs,
        pendingFees
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveProvider = async (req, res) => {
  try {
    const { id, type } = req.body;
    let vendor;
    if (type === 'Hotel') {
      vendor = await Hotel.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    } else {
      vendor = await CabVendor.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    }
    
    // Also update User role if they were just 'User' maybe?
    // Based on MVP, they are already 'Provider' but let's just return success
    
    res.json({ success: true, message: 'Provider approved', data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markFeeCollected = async (req, res) => {
  try {
    const { feeId } = req.params;
    const fee = await PlatformFee.findByIdAndUpdate(feeId, { status: 'collected' }, { new: true });
    res.json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
