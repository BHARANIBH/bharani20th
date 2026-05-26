const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Partner = require('../models/Partner');
const Order   = require('../models/Order');
const OTP     = require('../models/OTP');
const twilioService = require('../services/twilioService');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });
  try {
    req.partner = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// POST /api/partner/otp/send
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const otp = generateOTP();
    const sendResult = await twilioService.sendOTP(cleanPhone, otp);
    await OTP.create({ phone: cleanPhone, otp, channel: sendResult.channel || 'sms' });
    res.json({
      success: true,
      message: 'OTP sent',
      debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// POST /api/partner/otp/verify
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp, name, restaurantName } = req.body;
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

    const otpRecord = await OTP.findOne({ phone: cleanPhone, otp, isVerified: false, expiresAt: { $gt: new Date() } });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    otpRecord.isVerified = true;
    await otpRecord.save();

    let partner = await Partner.findOne({ phone: cleanPhone });
    if (!partner) {
      partner = await Partner.create({ phone: cleanPhone, name: name || `Partner${cleanPhone.slice(-4)}`, restaurantName: restaurantName || 'My Restaurant', isPhoneVerified: true, lastLogin: new Date() });
    } else {
      partner.lastLogin = new Date();
      partner.isPhoneVerified = true;
      await partner.save();
    }

    const token = jwt.sign({ partnerId: partner._id, phone: partner.phone, role: 'partner' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, partner: { id: partner._id, name: partner.name, phone: partner.phone, restaurantName: partner.restaurantName } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// GET /api/partner/orders — orders for this partner
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET /api/partner/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalOrders    = await Order.countDocuments();
    const todayOrders    = await Order.countDocuments({ createdAt: { $gte: today } });
    const pendingOrders  = await Order.countDocuments({ orderStatus: 'pending' });
    const preparingOrders= await Order.countDocuments({ orderStatus: { $in: ['confirmed', 'processing'] } });
    const readyOrders    = await Order.countDocuments({ orderStatus: 'out_for_delivery' });
    const revenue        = await Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
    res.json({ success: true, stats: { totalOrders, todayOrders, pendingOrders, preparing: preparingOrders, ready: readyOrders, revenue: revenue[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// PUT /api/partner/orders/:orderId — update order status (partner side)
router.put('/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowed = ['confirmed', 'processing', 'out_for_delivery', 'cancelled'];
    if (!allowed.includes(orderStatus)) return res.status(400).json({ success: false, message: 'Invalid status' });
    // Support both custom orderId string AND MongoDB _id
    let order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) { try { order = await Order.findById(req.params.orderId); } catch {} }
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.orderStatus = orderStatus;
    await order.save();
    // Broadcast to customer tracking + delivery app via socket
    req.app.emitOrderUpdate(String(order._id), orderStatus, { orderId: order.orderId });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

module.exports = router;
