const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  phone:           { type: String, required: true, unique: true },
  vehicleType:     { type: String, enum: ['bike', 'scooter', 'bicycle', 'other'], default: 'bike' },
  vehicleNumber:   { type: String, default: '' },
  isActive:        { type: Boolean, default: true },
  isAvailable:     { type: Boolean, default: true },
  isPhoneVerified: { type: Boolean, default: false },
  currentOrderId:  { type: String, default: null },
  totalDeliveries: { type: Number, default: 0 },
  createdAt:       { type: Date, default: Date.now },
  lastLogin:       { type: Date, default: Date.now },
});

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
