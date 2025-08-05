const mongoose = require('mongoose');

const TiffinScheduleSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_name: { type: String, required: true },
  weekly_schedule: {
    monday: { 
      enabled: { type: Boolean, default: false },
      deliveries: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
        time: { type: String, default: "12:00" },
        quantity: { type: Number, default: 1, min: 1, max: 10 }
      }]
    },
    tuesday: { 
      enabled: { type: Boolean, default: false },
      deliveries: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
        time: { type: String, default: "12:00" },
        quantity: { type: Number, default: 1, min: 1, max: 10 }
      }]
    },
    wednesday: { 
      enabled: { type: Boolean, default: false },
      deliveries: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
        time: { type: String, default: "12:00" },
        quantity: { type: Number, default: 1, min: 1, max: 10 }
      }]
    },
    thursday: { 
      enabled: { type: Boolean, default: false },
      deliveries: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
        time: { type: String, default: "12:00" },
        quantity: { type: Number, default: 1, min: 1, max: 10 }
      }]
    },
    friday: { 
      enabled: { type: Boolean, default: false },
      deliveries: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
        time: { type: String, default: "12:00" },
        quantity: { type: Number, default: 1, min: 1, max: 10 }
      }]
    },
    saturday: { 
      enabled: { type: Boolean, default: false },
      deliveries: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
        time: { type: String, default: "12:00" },
        quantity: { type: Number, default: 1, min: 1, max: 10 }
      }]
    },
    sunday: { 
      enabled: { type: Boolean, default: true },
      deliveries: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinVendor' },
        time: { type: String, default: "13:00" },
        quantity: { type: Number, default: 1, min: 1, max: 10 }
      }]
    }
  },
  holiday_mode: {
    enabled: { type: Boolean, default: false },
    start_date: { type: String }, // Format: YYYY-MM-DD
    end_date: { type: String },   // Format: YYYY-MM-DD
    reason: { type: String, default: "Holiday" }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TiffinSchedule', TiffinScheduleSchema);
