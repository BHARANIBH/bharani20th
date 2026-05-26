const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const jwt     = require('jsonwebtoken');

// ── Auth middleware ──────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'gonaatu_secret');
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

function generateOrderId() {
  return 'DESI' + Date.now() + Math.floor(Math.random() * 1000);
}

// GET all orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET orders by phone (customer)
router.get('/my/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ phone: req.params.phone }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET single order by orderId or _id
router.get('/:orderId', async (req, res) => {
  try {
    const order =
      await Order.findOne({ orderId: req.params.orderId }) ||
      await Order.findById(req.params.orderId).catch(() => null);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// POST create order  (accepts mobile app payload format)
router.post('/', auth, async (req, res) => {
  try {
    const io   = req.app.get('io');
    const body = req.body;

    // ── Map mobile app fields → Order schema ──────────────────────
    // Mobile sends: { items, deliveryAddress, deliverySlot, notes, total, grandTotal, paymentMethod, paymentId }
    // Schema needs: customerName, phone, address, products, quantity, subtotal, totalPrice, paymentMethod (lowercase)

    const items   = body.items   || body.products || [];
    const address = body.deliveryAddress || body.address || '';

    const products = items.map(i => ({
      productId: i.product || i.id || i._id || 0,
      name:      i.name    || '',
      price:     i.price   || 0,
      quantity:  i.qty     || i.quantity || 1,
      total:     (i.price || 0) * (i.qty || i.quantity || 1),
      image:     i.image   || '',
    }));

    const quantity      = items.reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
    const subtotal      = body.total    || body.subtotal    || 0;
    const deliveryCharge= body.deliveryCharge || (subtotal >= 500 ? 0 : 40);
    const totalPrice    = body.grandTotal || body.totalPrice || (subtotal + deliveryCharge);

    // paymentMethod: normalize to lowercase enum value
    const pmRaw   = (body.paymentMethod || 'cod').toLowerCase();
    const pmValid = ['razorpay', 'cod', 'upi', 'card', 'netbanking'].includes(pmRaw) ? pmRaw : 'cod';
    // schema enum is ['razorpay','cod'] — map upi/card/netbanking → razorpay
    const paymentMethod = (pmValid === 'cod') ? 'cod' : 'razorpay';

    // Customer details from JWT token
    const customerName = req.user.name  || body.customerName || 'Customer';
    const phone        = req.user.phone || body.phone        || '';

    const orderId = generateOrderId();

    const order = new Order({
      orderId,
      customerName,
      phone,
      email:         body.email || '',
      address,
      city:          body.city    || 'Bangalore',
      pincode:       body.pincode || '',
      deliverySlot:  body.deliverySlot || '9AM - 11AM',
      products,
      quantity,
      subtotal,
      deliveryCharge,
      totalPrice,
      paymentMethod,
      paymentStatus: (paymentMethod === 'razorpay' && body.paymentId) ? 'paid' : 'pending',
      orderStatus:   'pending',
      razorpayOrderId:   body.razorpayOrderId   || '',
      razorpayPaymentId: body.paymentId         || '',
      notes: body.notes || '',
    });

    await order.save();

    // Notify partner dashboard
    if (io) io.to('partners').emit('order:new', order);

    res.status(201).json({ success: true, orderId, order });
  } catch (e) {
    console.error('Order creation error:', e);
    res.status(500).json({ success: false, message: e.message || 'Failed to create order' });
  }
});

// PUT update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { orderStatus } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = orderStatus;
    await order.save();

    if (io) {
      io.to(`order:${req.params.orderId}`).emit('order:status', { orderId: req.params.orderId, orderStatus });
      io.to('partners').emit('order:updated', { orderId: req.params.orderId, orderStatus });
      io.to('delivery').emit('order:updated',  { orderId: req.params.orderId, orderStatus });
    }

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// GET pending live requests (partner polls this)
router.get('/live-requests/pending', async (req, res) => {
  try {
    const orders = await Order.find({ liveRequested: true })
      .select('orderId customerName phone liveRequested')
      .lean();
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Live Chicken Cutting View ────────────────────────────────── */

// Helper: find order by custom orderId OR MongoDB _id
async function findOrder(id) {
  return await Order.findOne({ orderId: id }) ||
         await Order.findById(id).catch(() => null);
}

// POST  customer requests live cutting
router.post('/:orderId/request-live', async (req, res) => {
  try {
    const io    = req.app.get('io');
    const order = await findOrder(req.params.orderId);
    if (!order) {
      console.log('❌ request-live: order not found for id:', req.params.orderId);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.liveRequested = true;
    await order.save();

    console.log(`🔴 Live requested for order ${order.orderId} by ${order.customerName}`);

    if (io) {
      io.to('partners').emit('live:requested', {
        orderId:      order.orderId,
        customerName: order.customerName,
      });
      console.log('📡 Emitted live:requested to partners room');
    } else {
      console.log('⚠️ io not available');
    }

    res.json({ success: true, message: 'Live request sent to partner' });
  } catch (e) {
    console.error('request-live error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST  partner sends YouTube live URL back to customer
router.post('/:orderId/send-live-url', async (req, res) => {
  try {
    const io      = req.app.get('io');
    const { liveUrl } = req.body;
    if (!liveUrl) return res.status(400).json({ success: false, message: 'liveUrl is required' });

    const order = await findOrder(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.liveStreamUrl = liveUrl;
    order.isLive        = true;
    order.liveRequested = false;
    await order.save();

    console.log(`📡 Sending live URL to order room: order:${order.orderId}`);

    if (io) {
      io.to(`order:${order.orderId}`).emit('live:url', { liveUrl });
    }
    res.json({ success: true, message: 'Live URL sent to customer' });
  } catch (e) {
    console.error('send-live-url error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST  partner is busy — inform customer
router.post('/:orderId/partner-busy', async (req, res) => {
  try {
    const io    = req.app.get('io');
    const order = await findOrder(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.liveRequested = false;
    await order.save();

    if (io) {
      io.to(`order:${order.orderId}`).emit('live:busy', { orderId: order.orderId });
    }
    res.json({ success: true, message: 'Customer notified that partner is busy' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT update payment
router.put('/:orderId/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.paymentStatus = paymentStatus;
    await order.save();
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
});

module.exports = router;
