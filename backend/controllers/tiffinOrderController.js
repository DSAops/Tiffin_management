const TiffinOrder = require('../models/TiffinOrder');
const TiffinVendor = require('../models/TiffinVendor');

// Get all tiffin orders for a user
const getUserTiffinOrders = async (req, res) => {
  try {
    const { dayOfWeek, userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const filter = { userId: userId, isActive: true };
    
    if (dayOfWeek) {
      filter.dayOfWeek = dayOfWeek.toLowerCase();
    }

    const orders = await TiffinOrder.find(filter)
      .populate('vendorId', 'name price description')
      .sort({ dayOfWeek: 1, deliveryTime: 1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching tiffin orders:', error);
    res.status(500).json({ error: 'Failed to fetch tiffin orders' });
  }
};

// Create new tiffin order
const createTiffinOrder = async (req, res) => {
  try {
    const { vendorId, dayOfWeek, deliveryTime, quantity, notes, userId } = req.body;
    
    if (!vendorId || !dayOfWeek || !deliveryTime || !quantity || !userId) {
      return res.status(400).json({ 
        error: 'Vendor, day of week, delivery time, quantity, and user ID are required' 
      });
    }

    // Validate vendor exists and is active
    const vendor = await TiffinVendor.findOne({ _id: vendorId, isActive: true });
    if (!vendor) {
      return res.status(400).json({ error: 'Invalid or inactive vendor' });
    }

    // Validate day of week
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(dayOfWeek.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid day of week' });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(deliveryTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
    }

    const order = new TiffinOrder({
      userId: userId,
      vendorId,
      dayOfWeek: dayOfWeek.toLowerCase(),
      deliveryTime,
      quantity: parseInt(quantity),
      notes: notes || ''
    });

    await order.save();
    await order.populate('vendorId', 'name price description');
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating tiffin order:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        error: 'You already have an order for this vendor at this time on this day' 
      });
    } else {
      res.status(500).json({ error: 'Failed to create tiffin order' });
    }
  }
};

// Update tiffin order
const updateTiffinOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId, deliveryTime, quantity, notes, isActive, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const order = await TiffinOrder.findOne({ _id: id, userId: userId });
    if (!order) {
      return res.status(404).json({ error: 'Tiffin order not found' });
    }

    if (vendorId) {
      const vendor = await TiffinVendor.findOne({ _id: vendorId, isActive: true });
      if (!vendor) {
        return res.status(400).json({ error: 'Invalid or inactive vendor' });
      }
      order.vendorId = vendorId;
    }

    if (deliveryTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(deliveryTime)) {
        return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
      }
      order.deliveryTime = deliveryTime;
    }

    if (quantity !== undefined) order.quantity = parseInt(quantity);
    if (notes !== undefined) order.notes = notes;
    if (isActive !== undefined) order.isActive = isActive;

    await order.save();
    await order.populate('vendorId', 'name price description');
    
    res.json(order);
  } catch (error) {
    console.error('Error updating tiffin order:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        error: 'You already have an order for this vendor at this time on this day' 
      });
    } else {
      res.status(500).json({ error: 'Failed to update tiffin order' });
    }
  }
};

// Delete tiffin order
const deleteTiffinOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const order = await TiffinOrder.findOneAndDelete({ _id: id, userId: userId });
    if (!order) {
      return res.status(404).json({ error: 'Tiffin order not found' });
    }
    
    res.json({ message: 'Tiffin order deleted successfully' });
  } catch (error) {
    console.error('Error deleting tiffin order:', error);
    res.status(500).json({ error: 'Failed to delete tiffin order' });
  }
};

// Get orders by day of week
const getOrdersByDay = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(dayOfWeek.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid day of week' });
    }

    const orders = await TiffinOrder.find({ 
      userId: userId, 
      dayOfWeek: dayOfWeek.toLowerCase(),
      isActive: true 
    })
    .populate('vendorId', 'name price description')
    .sort({ deliveryTime: 1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by day:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

module.exports = {
  getUserTiffinOrders,
  createTiffinOrder,
  updateTiffinOrder,
  deleteTiffinOrder,
  getOrdersByDay
};
