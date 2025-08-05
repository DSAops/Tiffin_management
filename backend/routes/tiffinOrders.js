const express = require('express');
const router = express.Router();
const {
  getUserTiffinOrders,
  createTiffinOrder,
  updateTiffinOrder,
  deleteTiffinOrder,
  getOrdersByDay
} = require('../controllers/tiffinOrderController');

// Get all tiffin orders for user (optionally filter by day)
router.get('/', getUserTiffinOrders);

// Get orders by specific day
router.get('/day/:dayOfWeek', getOrdersByDay);

// Create new tiffin order
router.post('/', createTiffinOrder);

// Update tiffin order
router.put('/:id', updateTiffinOrder);

// Delete tiffin order
router.delete('/:id', deleteTiffinOrder);

module.exports = router;
