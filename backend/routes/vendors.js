const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorById
} = require('../controllers/vendorController');

// Get all vendors
router.get('/', auth, getAllVendors);

// Get vendor by ID
router.get('/:id', auth, getVendorById);

// Create new vendor
router.post('/', auth, createVendor);

// Update vendor
router.put('/:id', auth, updateVendor);

// Delete vendor (soft delete)
router.delete('/:id', auth, deleteVendor);

module.exports = router;
