const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    default: 'Bangalore',
  },
  pincode: {
    type: String,
    default: '',
  },
  deliverySlot: {
    type: String,
    default: '9AM - 11AM',
  },
  notes: {
    type: String,
    default: '',
  },
  products: [{
    productId: mongoose.Schema.Types.Mixed,
    name:      String,
    price:     Number,
    quantity:  Number,
    total:     Number,
    image:     String,
  }],
  quantity: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  deliveryCharge: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    required: true,
    default: 'cod',
  },
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },

  /* ── Live Chicken Cutting View ─────────────────────────────── */
  liveRequested:  { type: Boolean, default: false },
  isLive:         { type: Boolean, default: false },
  liveStreamUrl:  { type: String,  default: '' },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
