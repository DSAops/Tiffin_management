const TiffinVendor = require('../models/TiffinVendor');

// Get all active vendors
const getAllVendors = async (req, res) => {
  try {
    const vendors = await TiffinVendor.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });
    
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// Create new vendor
const createVendor = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Check if vendor already exists
    const existingVendor = await TiffinVendor.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingVendor) {
      return res.status(400).json({ error: 'Vendor with this name already exists' });
    }

    const vendor = new TiffinVendor({
      name: name.trim(),
      price: parseFloat(price),
      description: description || '',
      createdBy: req.user.id
    });

    await vendor.save();
    await vendor.populate('createdBy', 'name email');
    
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Vendor with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create vendor' });
    }
  }
};

// Update vendor
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, isActive } = req.body;

    const vendor = await TiffinVendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Only allow creator or admin to update
    if (vendor.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this vendor' });
    }

    if (name) vendor.name = name.trim();
    if (price !== undefined) vendor.price = parseFloat(price);
    if (description !== undefined) vendor.description = description;
    if (isActive !== undefined) vendor.isActive = isActive;

    await vendor.save();
    await vendor.populate('createdBy', 'name email');
    
    res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Vendor with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update vendor' });
    }
  }
};

// Delete vendor (soft delete)
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await TiffinVendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Only allow creator or admin to delete
    if (vendor.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this vendor' });
    }

    vendor.isActive = false;
    await vendor.save();
    
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
};

// Get vendor by ID
const getVendorById = async (req, res) => {
  try {
    const vendor = await TiffinVendor.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};

module.exports = {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorById
};
