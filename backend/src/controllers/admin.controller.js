const User = require('../models/User');
const Hotel = require('../models/Hotel');
const CabVendor = require('../models/CabVendor');
const PlatformFee = require('../models/PlatformFee');
const Vehicle = require('../models/Vehicle');

exports.getDashboardStats = async (req, res) => {
  try {
    const unapprovedHotels = await Hotel.find({ status: 'pending' }).populate('providerId', 'name email');
    const unapprovedHotelCabs = await CabVendor.find({ status: 'pending', cabSourceType: 'HOTEL_LINKED' }).populate('providerId', 'name email').populate('hotelId', 'profile.hotelName');
    const unapprovedIndependentCabs = await CabVendor.find({ status: 'pending', cabSourceType: 'INDEPENDENT' }).populate('providerId', 'name email');
    const pendingFees = await PlatformFee.find({ status: 'pending' }).populate('providerId', 'firstName lastName');

    res.json({
      success: true,
      data: {
        unapprovedHotels,
        unapprovedHotelCabs,
        unapprovedIndependentCabs,
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
    const ProviderProfile = require('../models/ProviderProfile');
    const crypto = require('crypto');
    const User = require('../models/User');

    if (type === 'Hotel') {
      vendor = await Hotel.findByIdAndUpdate(id, { isApproved: true, status: 'approved', rejectionReason: '' }, { new: true });
      if (vendor) {
        await ProviderProfile.findOneAndUpdate(
          { userId: vendor.providerId },
          { 'hotelService.status': 'active', status: 'active' }
        );
      }
    } else {
      vendor = await CabVendor.findById(id);
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
      
      // Auto-generate Driver account if not exists
      if (!vendor.driverId) {
        const driverMobile = vendor.vendorDetails.mobile;
        const driverEmail = vendor.vendorDetails.email || `driver_${driverMobile}@inohotelsol.com`;
        
        let driverUser = await User.findOne({ $or: [{ mobile: driverMobile }, { email: driverEmail }] });
        let generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 char hex
        
        if (!driverUser) {
          driverUser = await User.create({
            name: vendor.vendorDetails.driverName,
            email: driverEmail,
            mobile: driverMobile,
            password: generatedPassword,
            role: 'Provider',
            providerType: 'Driver'
          });
        }
        
        vendor.driverId = driverUser._id;
        vendor.driverCredentials = {
          loginId: driverMobile,
          password: generatedPassword
        };
      }
      
      vendor.isApproved = true;
      vendor.status = 'approved';
      vendor.rejectionReason = '';
      await vendor.save();

      await ProviderProfile.findOneAndUpdate(
        { userId: vendor.providerId },
        { 'cabService.status': 'active', status: 'active' }
      );
      await Vehicle.updateMany({ vendorId: vendor._id }, { isApproved: true });
    }
    
    res.json({ success: true, message: 'Provider approved', data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectProvider = async (req, res) => {
  try {
    const { id, type, reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    let vendor;
    if (type === 'Hotel') {
      vendor = await Hotel.findByIdAndUpdate(id, { isApproved: false, status: 'rejected', rejectionReason: reason }, { new: true });
      if (vendor) {
        await ProviderProfile.findOneAndUpdate(
          { userId: vendor.providerId },
          { 'hotelService.status': 'rejected' }
        );
      }
    } else {
      vendor = await CabVendor.findByIdAndUpdate(id, { isApproved: false, status: 'rejected', rejectionReason: reason }, { new: true });
      if (vendor) {
        await ProviderProfile.findOneAndUpdate(
          { userId: vendor.providerId },
          { 'cabService.status': 'rejected' }
        );
      }
    }
    
    res.json({ success: true, message: 'Provider rejected', data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProviderDetails = async (req, res) => {
  try {
    const { id, type } = req.params;
    let vendor;
    if (type === 'Hotel') {
      vendor = await Hotel.findById(id).populate('providerId', 'name email mobile');
      if (!vendor) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: vendor });
    } else {
      vendor = await CabVendor.findById(id).populate('providerId', 'name email mobile').populate('hotelId', 'profile.hotelName');
      if (!vendor) return res.status(404).json({ success: false, message: 'Not found' });
      
      const Vehicle = require('../models/Vehicle');
      const vehicle = await Vehicle.findOne({ vendorId: vendor._id });
      
      // Merge vehicle details into vendor response
      const vendorObj = vendor.toObject();
      if (vehicle) {
        vendorObj.vehicleDetails = vehicle.details;
        vendorObj.vehicleDocuments = vehicle.documents;
      }
      
      res.json({ success: true, data: vendorObj });
    }
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

const Booking = require('../models/Booking');

exports.assignCab = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cabVendorId, vehicleId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.bookingType !== 'CAB') {
      return res.status(404).json({ success: false, message: 'Cab booking not found' });
    }

    const cabVendor = await CabVendor.findById(cabVendorId);
    if (!cabVendor || !cabVendor.isApproved) {
      return res.status(400).json({ success: false, message: 'Invalid or unapproved cab vendor' });
    }

    booking.cabBooking.vendorId = cabVendorId;
    booking.cabBooking.vehicleId = vehicleId;
    booking.cabBooking.status = 'assigned';
    booking.cabBooking.acceptedAt = new Date();

    await booking.save();

    res.json({ success: true, message: 'Cab successfully assigned', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSupportTickets = async (req, res) => {
  try {
    const SupportTicket = require('../models/SupportTicket');
    const tickets = await SupportTicket.find({})
      .populate('userId', 'name email')
      .populate('bookingId', 'bookingId')
      .sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.replyToSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    const SupportTicket = require('../models/SupportTicket');

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (message) {
      ticket.messages.push({
        sender: req.user.id,
        senderModel: 'User', // Wait, Admin model is User with role='Admin'
        message: message,
        timestamp: new Date()
      });
    }
    
    if (status) {
      ticket.status = status;
    }

    await ticket.save();
    
    // Emit socket event to notify user
    const io = req.app.get('io');
    if (io) {
      io.to(`ticket_${ticket._id}`).emit('new_ticket_message', ticket);
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('userId', 'name email mobile')
      .populate('hotelBooking.hotelId', 'profile.hotelName')
      .populate('cabBooking.vendorId', 'vendorDetails.driverName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Booking.find({ totalAmount: { $gt: 0 } })
      .select('bookingId bookingType paymentMode paymentStatus totalAmount taxAmount discountAmount platformCommission partnerEarning createdAt userId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSettlements = async (req, res) => {
  try {
    const settlements = await PlatformFee.find({})
      .populate('providerId', 'name email mobile')
      .populate('bookingId', 'bookingId totalAmount')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroupedCabs = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isApproved: true })
      .populate('hotelId', 'profile.hotelName')
      .populate({
        path: 'vendorId',
        select: 'vendorDetails providerId',
        populate: { path: 'providerId', select: 'name email mobile' }
      });

    const hotelCabs = {};
    const externalCabs = {};

    vehicles.forEach(v => {
      if (v.cabSourceType === 'HOTEL_LINKED' && v.hotelId) {
        const hotelName = v.hotelId.profile?.hotelName || 'Unknown Hotel';
        if (!hotelCabs[hotelName]) hotelCabs[hotelName] = [];
        hotelCabs[hotelName].push(v);
      } else if (v.cabSourceType === 'INDEPENDENT' && v.vendorId) {
        const agencyName = v.vendorId.providerId?.name || v.vendorId.vendorDetails?.fleetCompanyName || v.vendorId.vendorDetails?.driverName || 'Independent Driver';
        if (!externalCabs[agencyName]) externalCabs[agencyName] = [];
        externalCabs[agencyName].push(v);
      }
    });

    // Convert object maps to arrays for easier mapping on frontend
    const formattedHotelCabs = Object.keys(hotelCabs).map(key => ({ groupName: key, cabs: hotelCabs[key] }));
    const formattedExternalCabs = Object.keys(externalCabs).map(key => ({ groupName: key, cabs: externalCabs[key] }));

    res.json({ success: true, data: { hotelCabs: formattedHotelCabs, externalCabs: formattedExternalCabs } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    await Vehicle.findByIdAndDelete(id);
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllWithdrawals = async (req, res) => {
  try {
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const withdrawals = await WithdrawalRequest.find({})
      .populate('providerId', 'name email mobile')
      .sort({ createdAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    
    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }
    
    withdrawal.status = status;
    if (adminNotes !== undefined) {
      withdrawal.adminNotes = adminNotes;
    }
    
    await withdrawal.save();
    res.json({ success: true, message: 'Withdrawal status updated', withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
