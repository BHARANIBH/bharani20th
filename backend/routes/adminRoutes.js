const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// Admin login (simple for demo)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Update order status
router.put('/orders/:orderId', async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { orderStatus },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      req.body,
      { new: true }
    );
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

module.exports = router;
