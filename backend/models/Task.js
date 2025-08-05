const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  flat_id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  default_frequency: { type: String, required: true },
  auto_increment: { type: Boolean, default: false },
  created_by: { type: String, required: true },
  created_on: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
