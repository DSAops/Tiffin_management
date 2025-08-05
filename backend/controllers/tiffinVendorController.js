const TiffinVendor = require('../models/TiffinVendor');
const { validationResult } = require('express-validator');

// Get all active vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await TiffinVendor.find({ isActive: true })
      .sort({ name: 1 })
      .populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors'
    });
  }
};

// Get vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await TiffinVendor.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor'
    });
  }
};

// Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, price, description } = req.body;

    // Check if vendor with same name already exists
    const existingVendor = await TiffinVendor.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        error: 'Vendor with this name already exists'
      });
    }

    const vendor = new TiffinVendor({
      name,
      price,
      description,
      createdBy: req.user.id
    });

    await vendor.save();

    const populatedVendor = await TiffinVendor.findById(vendor._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedVendor,
      message: 'Vendor created successfully'
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vendor'
    });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, price, description, isActive } = req.body;
    const vendor = await TiffinVendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Check if another vendor with same name exists
    if (name && name !== vendor.name) {
      const existingVendor = await TiffinVendor.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingVendor) {
        return res.status(400).json({
          success: false,
          error: 'Vendor with this name already exists'
        });
      }
    }

    // Update fields
    if (name) vendor.name = name;
    if (price !== undefined) vendor.price = price;
    if (description !== undefined) vendor.description = description;
    if (isActive !== undefined) vendor.isActive = isActive;

    await vendor.save();

    const updatedVendor = await TiffinVendor.findById(vendor._id)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedVendor,
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor'
    });
  }
};

// Delete vendor (soft delete)
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await TiffinVendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Soft delete by setting isActive to false
    vendor.isActive = false;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vendor'
    });
  }
};

// Get vendor statistics
exports.getVendorStats = async (req, res) => {
  try {
    const totalVendors = await TiffinVendor.countDocuments({ isActive: true });
    const averagePrice = await TiffinVendor.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);

    const priceRange = await TiffinVendor.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: null, 
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        } 
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalVendors,
        averagePrice: averagePrice[0]?.avgPrice || 0,
        minPrice: priceRange[0]?.minPrice || 0,
        maxPrice: priceRange[0]?.maxPrice || 0
      }
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor statistics'
    });
  }
};
