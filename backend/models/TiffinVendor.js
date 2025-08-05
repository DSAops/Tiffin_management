const mongoose = require('mongoose');

const tiffinVendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
tiffinVendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const TiffinVendor = mongoose.model('TiffinVendor', tiffinVendorSchema);

module.exports = TiffinVendor;
