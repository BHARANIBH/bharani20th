const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Lazy init — only created when first used, so missing env vars don't crash startup
let _razorpay = null;
const getRazorpay = () => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
};

// POST create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    
    const options = {
      amount: Math.round(amount * 100),
      currency: currency || 'INR',
      receipt: receipt,
      payment_capture: 1,
    };
    
    const order = await getRazorpay().orders.create(options);
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// POST verify payment
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
      const order = await Order.findOne({ orderId: orderId });
      if (order) {
        order.paymentStatus = 'paid';
        order.razorpayOrderId = razorpay_order_id;
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();
      }
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Verification error' });
  }
});

// GET razorpay key
router.get('/key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
