const express = require('express');
const router = express.Router();
const {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorById
} = require('../controllers/vendorController');

// Get all vendors
router.get('/', getAllVendors);

// Get vendor by ID
router.get('/:id', getVendorById);

// Create new vendor
router.post('/', createVendor);

// Update vendor
router.put('/:id', updateVendor);

// Delete vendor (soft delete)
router.delete('/:id', deleteVendor);

module.exports = router;
