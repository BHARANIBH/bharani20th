const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  phone:          { type: String, required: true, unique: true },
  restaurantName: { type: String, required: true },
  address:        { type: String, default: '' },
  isActive:       { type: Boolean, default: true },
  isPhoneVerified:{ type: Boolean, default: false },
  totalOrders:    { type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now },
  lastLogin:      { type: Date, default: Date.now },
});

module.exports = mongoose.model('Partner', partnerSchema);
