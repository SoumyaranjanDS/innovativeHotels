const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const BookingHold = require('../models/BookingHold');

// @desc    Create Stripe PaymentIntent
// @route   POST /api/payments/create-intent
exports.createIntent = async (req, res) => {
  try {
    const { holdId, needPickupCab, cabFare } = req.body;

    const hold = await BookingHold.findById(holdId);
    if (!hold) return res.status(404).json({ success: false, message: 'Hold not found' });
    if (hold.status !== 'active') return res.status(400).json({ success: false, message: 'Hold is not active' });
    if (new Date() > hold.expiresAt) return res.status(400).json({ success: false, message: 'Hold expired' });

    let totalPrice = hold.priceSnapshot.totalPrice;

    // Add cab fare if applicable
    if (needPickupCab === 'external' && cabFare) {
      totalPrice += Number(cabFare);
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // convert to paise
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        holdId: hold._id.toString()
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
