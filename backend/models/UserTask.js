const mongoose = require('mongoose');

const HaltModeSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  start_date: { type: Date },
  end_date: { type: Date }
}, { _id: false });

const HaltHistoryEntrySchema = new mongoose.Schema({
  start: { type: Date },
  end: { type: Date }
}, { _id: false });

const UserTaskSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  task_id: { type: String, required: true },
  user_counter: { type: Number, default: 0 },
  calendar: { type: Map, of: Number, default: {} },
  custom_schedule: { type: Map, of: Number, default: {} },
  auto_increment_enabled: { type: Boolean, default: true },
  last_updated: { type: Date, default: Date.now },
  halt_mode: { type: HaltModeSchema, default: () => ({}) },
  halt_history: { type: [HaltHistoryEntrySchema], default: [] }
});

module.exports = mongoose.model('UserTask', UserTaskSchema);
