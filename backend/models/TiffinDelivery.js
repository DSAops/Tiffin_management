const mongoose = require('mongoose');

const TiffinDeliverySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_name: { type: String, required: true },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
  delivery_date: { type: String, required: true }, // Format: YYYY-MM-DD
  scheduled_time: { type: String, required: true }, // Format: HH:MM
  quantity: { type: Number, required: true, default: 1 },
  delivered: { type: Boolean, default: false },
  delivered_at: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'delivered', 'cancelled', 'holiday'], 
    default: 'pending' 
  },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index for efficient queries
TiffinDeliverySchema.index({ user_id: 1, delivery_date: 1 });
TiffinDeliverySchema.index({ delivery_date: 1 });
TiffinDeliverySchema.index({ user_id: 1, delivery_date: 1, vendor_id: 1 });

module.exports = mongoose.model('TiffinDelivery', TiffinDeliverySchema);
