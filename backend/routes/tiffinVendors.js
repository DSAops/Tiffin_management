const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const vendorController = require('../controllers/tiffinVendorController');

// Validation middleware
const vendorValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
];

const vendorUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Routes - no auth needed for local app
router.get('/', vendorController.getAllVendors);
router.get('/stats', vendorController.getVendorStats);
router.get('/:id', vendorController.getVendorById);
router.post('/', vendorValidation, vendorController.createVendor);
router.put('/:id', vendorUpdateValidation, vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
