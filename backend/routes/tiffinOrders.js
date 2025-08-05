const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUserTiffinOrders,
  createTiffinOrder,
  updateTiffinOrder,
  deleteTiffinOrder,
  getOrdersByDay
} = require('../controllers/tiffinOrderController');

// Get all tiffin orders for user (optionally filter by day)
router.get('/', auth, getUserTiffinOrders);

// Get orders by specific day
router.get('/day/:dayOfWeek', auth, getOrdersByDay);

// Create new tiffin order
router.post('/', auth, createTiffinOrder);

// Update tiffin order
router.put('/:id', auth, updateTiffinOrder);

// Delete tiffin order
router.delete('/:id', auth, deleteTiffinOrder);

module.exports = router;
