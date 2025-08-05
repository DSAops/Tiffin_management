const UserTask = require('../models/UserTask');

exports.assignTaskToUser = async (req, res) => {
  try {
    const ut = new UserTask(req.body);
    await ut.save();
    res.status(201).json(ut);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateUserTaskCounter = async (req, res) => {
  try {
    const ut = await UserTask.findById(req.params.id);
    if (!ut) return res.status(404).json({ error: 'UserTask not found' });
    const { date, increment } = req.body;
    const d = date || new Date().toISOString().slice(0, 10);
    const inc = increment || 1;
    ut.calendar.set(d, (ut.calendar.get(d) || 0) + inc);
    ut.user_counter += inc;
    ut.last_updated = new Date();
    await ut.save();
    res.json(ut);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.pauseUserTask = async (req, res) => {
  try {
    const ut = await UserTask.findById(req.params.id);
    if (!ut) return res.status(404).json({ error: 'UserTask not found' });
    const { start_date, end_date } = req.body;
    ut.halt_mode.enabled = true;
    ut.halt_mode.start_date = start_date;
    ut.halt_mode.end_date = end_date;
    ut.halt_history.push({ start: start_date, end: end_date });
    await ut.save();
    res.json(ut);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.resumeUserTask = async (req, res) => {
  try {
    const ut = await UserTask.findById(req.params.id);
    if (!ut) return res.status(404).json({ error: 'UserTask not found' });
    ut.halt_mode.enabled = false;
    ut.halt_mode.start_date = null;
    ut.halt_mode.end_date = null;
    await ut.save();
    res.json(ut);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserTasksForTask = async (req, res) => {
  try {
    const uts = await UserTask.find({ task_id: req.params.task_id });
    res.json(uts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserTasksForUser = async (req, res) => {
  try {
    const uts = await UserTask.find({ user_id: req.params.user_id });
    res.json(uts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
