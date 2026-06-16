const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

exports.register = async (req, res) => {
  try {
    let { name, email, mobile, password, role, providerType, location } = req.body;
    email = email?.trim().toLowerCase();
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await User.create({ name, email, mobile, password, role, providerType, location });
    
    // Auto-create ProviderProfile if role is Provider
    if (role === 'Provider') {
      const ProviderProfile = require('../models/ProviderProfile');
      await ProviderProfile.create({ userId: user._id });
    }

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name, email, role, providerType }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    const loginId = email?.trim().toLowerCase();
    
    // Find by email or mobile
    const user = await User.findOne({ 
      $or: [{ email: loginId }, { mobile: loginId }] 
    });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.status === 'blocked') {
        return res.status(403).json({ success: false, message: 'User is blocked' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email, role: user.role, providerType: user.providerType }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
