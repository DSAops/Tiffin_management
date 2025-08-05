const mongoose = require('mongoose');

const tiffinOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TiffinVendor',
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  deliveryTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate orders for same user, vendor, day, and time
tiffinOrderSchema.index({ 
  userId: 1, 
  vendorId: 1, 
  dayOfWeek: 1, 
  deliveryTime: 1 
}, { unique: true });

// Index for queries
tiffinOrderSchema.index({ userId: 1, dayOfWeek: 1 });
tiffinOrderSchema.index({ isActive: 1 });

module.exports = mongoose.model('TiffinOrder', tiffinOrderSchema);
