const express        = require('express');
const router         = express.Router();
const jwt            = require('jsonwebtoken');
const DeliveryAgent  = require('../models/DeliveryAgent');
const Order          = require('../models/Order');
const OTP            = require('../models/OTP');
const twilioService  = require('../services/twilioService');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });
  try {
    req.agent = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// POST /api/delivery/otp/send
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

// POST /api/delivery/otp/verify
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp, name, vehicleType } = req.body;
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

    const otpRecord = await OTP.findOne({ phone: cleanPhone, otp, isVerified: false, expiresAt: { $gt: new Date() } });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    otpRecord.isVerified = true;
    await otpRecord.save();

    let agent = await DeliveryAgent.findOne({ phone: cleanPhone });
    if (!agent) {
      agent = await DeliveryAgent.create({ phone: cleanPhone, name: name || `Agent${cleanPhone.slice(-4)}`, vehicleType: vehicleType || 'bike', isPhoneVerified: true, lastLogin: new Date() });
    } else {
      agent.lastLogin = new Date();
      agent.isPhoneVerified = true;
      await agent.save();
    }

    const token = jwt.sign({ agentId: agent._id, phone: agent.phone, role: 'delivery' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, agent: { id: agent._id, name: agent.name, phone: agent.phone, vehicleType: agent.vehicleType, isAvailable: agent.isAvailable } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// GET /api/delivery/orders — orders ready for pickup or active
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: { $in: ['confirmed', 'processing', 'out_for_delivery'] } }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET /api/delivery/my-order — current active delivery for this agent
router.get('/my-order', authMiddleware, async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.agent.agentId);
    if (!agent?.currentOrderId) return res.json({ success: true, order: null });
    const order = await Order.findById(agent.currentOrderId);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// PUT /api/delivery/orders/:orderId — accept or update delivery status
router.put('/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowed = ['out_for_delivery', 'delivered'];
    if (!allowed.includes(orderStatus)) return res.status(400).json({ success: false, message: 'Invalid status' });

    // Support both custom orderId string AND MongoDB _id
    let order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) { try { order = await Order.findById(req.params.orderId); } catch {} }
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = orderStatus;
    await order.save();

    // Track current order on agent
    const agent = await DeliveryAgent.findById(req.agent.agentId);
    if (agent) {
      agent.currentOrderId = orderStatus === 'delivered' ? null : order._id;
      if (orderStatus === 'delivered') agent.totalDeliveries += 1;
      await agent.save();
    }

    // Broadcast to customer tracking screen + partner app via socket
    req.app.emitOrderUpdate(String(order._id), orderStatus, { orderId: order.orderId });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

// PUT /api/delivery/availability — toggle availability
router.put('/availability', authMiddleware, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const agent = await DeliveryAgent.findByIdAndUpdate(req.agent.agentId, { isAvailable }, { new: true });
    res.json({ success: true, isAvailable: agent.isAvailable });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
});

module.exports = router;
