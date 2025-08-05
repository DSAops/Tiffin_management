const TiffinSchedule = require('../models/TiffinSchedule');
const TiffinDelivery = require('../models/TiffinDelivery');
const TiffinVendor = require('../models/TiffinVendor');
const mongoose = require('mongoose');

// Get user's tiffin schedule
exports.getSchedule = async (req, res) => {
  try {
    const { user_id } = req.params;
    let schedule = await TiffinSchedule.findOne({ user_id });
    
    if (!schedule) {
      // Create default schedule if doesn't exist
      schedule = new TiffinSchedule({
        user_id,
        user_name: 'User', // We'll set a default name since we don't have user lookup
        weekly_schedule: {
          monday: { enabled: false, deliveries: [] },
          tuesday: { enabled: false, deliveries: [] },
          wednesday: { enabled: false, deliveries: [] },
          thursday: { enabled: false, deliveries: [] },
          friday: { enabled: false, deliveries: [] },
          saturday: { enabled: false, deliveries: [] },
          sunday: { enabled: true, deliveries: [] }
        }
      });
      await schedule.save();
    }

    // Manually populate vendor data
    if (schedule) {
      const populatedSchedule = JSON.parse(JSON.stringify(schedule));
      
      for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
        if (populatedSchedule.weekly_schedule[day].deliveries) {
          for (const delivery of populatedSchedule.weekly_schedule[day].deliveries) {
            if (delivery.vendorId) {
              try {
                const vendor = await TiffinVendor.findById(delivery.vendorId);
                delivery.vendorId = vendor || { name: 'Unknown Vendor', price: 0 };
              } catch (err) {
                delivery.vendorId = { name: 'Unknown Vendor', price: 0 };
              }
            }
          }
        }
      }
      
      return res.json(populatedSchedule);
    }
    
    res.json(schedule);
  } catch (err) {
    console.error('Error in getSchedule:', err);
    res.status(500).json({ error: err.message });
  }
};

// Add delivery to a specific day
exports.addDeliveryToDay = async (req, res) => {
  try {
    const { user_id, day } = req.params;
    const { vendorId, time, quantity } = req.body;
    
    // Convert day to lowercase to match our schema
    const dayLower = day.toLowerCase();
    
    // Validate vendor exists
    const vendor = await TiffinVendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // Get user schedule
    let schedule = await TiffinSchedule.findOne({ user_id });
    if (!schedule) {
      schedule = new TiffinSchedule({
        user_id,
        user_name: 'User', // Default name since we don't have user lookup
        weekly_schedule: {
          monday: { enabled: false, deliveries: [] },
          tuesday: { enabled: false, deliveries: [] },
          wednesday: { enabled: false, deliveries: [] },
          thursday: { enabled: false, deliveries: [] },
          friday: { enabled: false, deliveries: [] },
          saturday: { enabled: false, deliveries: [] },
          sunday: { enabled: true, deliveries: [] }
        }
      });
    }
    
    // Add delivery to the specified day
    if (!schedule.weekly_schedule[dayLower]) {
      return res.status(400).json({ error: 'Invalid day specified' });
    }
    
    const newDelivery = { vendorId, time, quantity: quantity || 1 };
    schedule.weekly_schedule[dayLower].deliveries.push(newDelivery);
    schedule.weekly_schedule[dayLower].enabled = true; // Enable the day when adding delivery
    schedule.updated_at = new Date();
    
    await schedule.save();
    
    // Manually populate vendor data in the response schedule
    const responseSchedule = JSON.parse(JSON.stringify(schedule));
    
    for (const dayName of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      if (responseSchedule.weekly_schedule[dayName] && responseSchedule.weekly_schedule[dayName].deliveries) {
        for (const delivery of responseSchedule.weekly_schedule[dayName].deliveries) {
          if (delivery.vendorId) {
            try {
              const vendorInfo = await TiffinVendor.findById(delivery.vendorId);
              console.log(`Found vendor for ${dayName}:`, vendorInfo);
              delivery.vendorId = vendorInfo || { name: 'Unknown Vendor', price: 0 };
            } catch (err) {
              console.log(`Error finding vendor for ${dayName}:`, err.message);
              delivery.vendorId = { name: 'Unknown Vendor', price: 0 };
            }
          }
        }
      }
    }
    
    res.json({ 
      message: 'Delivery added successfully', 
      schedule: responseSchedule,
      addedDelivery: {
        vendorId: vendor,
        time: time,
        quantity: quantity || 1
      }
    });
  } catch (err) {
    console.error('Error in addDeliveryToDay:', err);
    res.status(500).json({ error: err.message });
  }
};

// Remove delivery from a specific day
exports.removeDeliveryFromDay = async (req, res) => {
  try {
    const { user_id, day, delivery_id } = req.params;
    
    // Convert day to lowercase to match our schema
    const dayLower = day.toLowerCase();
    
    const schedule = await TiffinSchedule.findOne({ user_id });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    if (!schedule.weekly_schedule[dayLower]) {
      return res.status(400).json({ error: 'Invalid day specified' });
    }
    
    // Remove the delivery
    schedule.weekly_schedule[dayLower].deliveries = schedule.weekly_schedule[dayLower].deliveries.filter(
      delivery => delivery._id.toString() !== delivery_id
    );
    
    // If no deliveries left, disable the day
    if (schedule.weekly_schedule[dayLower].deliveries.length === 0) {
      schedule.weekly_schedule[dayLower].enabled = false;
    }
    
    schedule.updated_at = new Date();
    await schedule.save();
    
    res.json({ message: 'Delivery removed successfully', schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit delivery in a specific day
exports.editDeliveryInDay = async (req, res) => {
  try {
    const { user_id, day, delivery_id } = req.params;
    const { vendorId, time, quantity } = req.body;
    
    // Convert day to lowercase to match our schema
    const dayLower = day.toLowerCase();
    
    // Validate vendor exists if vendorId is provided
    if (vendorId) {
      const vendor = await TiffinVendor.findById(vendorId);
      if (!vendor) {
        return res.status(400).json({ error: 'Vendor not found' });
      }
    }
    
    const schedule = await TiffinSchedule.findOne({ user_id });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    if (!schedule.weekly_schedule[dayLower]) {
      return res.status(400).json({ error: 'Invalid day specified' });
    }
    
    // Find and update the delivery
    const delivery = schedule.weekly_schedule[dayLower].deliveries.id(delivery_id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    // Update delivery fields
    if (vendorId) delivery.vendorId = vendorId;
    if (time) delivery.time = time;
    if (quantity !== undefined) delivery.quantity = quantity;
    
    schedule.updated_at = new Date();
    await schedule.save();
    
    // Manually populate vendor data in the response
    const responseSchedule = JSON.parse(JSON.stringify(schedule));
    for (const dayName of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      if (responseSchedule.weekly_schedule[dayName] && responseSchedule.weekly_schedule[dayName].deliveries) {
        for (const deliveryItem of responseSchedule.weekly_schedule[dayName].deliveries) {
          if (deliveryItem.vendorId) {
            try {
              const vendorInfo = await TiffinVendor.findById(deliveryItem.vendorId);
              deliveryItem.vendorId = vendorInfo || { name: 'Unknown Vendor', price: 0 };
            } catch (err) {
              deliveryItem.vendorId = { name: 'Unknown Vendor', price: 0 };
            }
          }
        }
      }
    }
    
    res.json({ message: 'Delivery updated successfully', schedule: responseSchedule });
  } catch (err) {
    console.error('Error in editDeliveryInDay:', err);
    res.status(500).json({ error: err.message });
  }
};

// Copy delivery to multiple days
exports.copyDeliveryToMultipleDays = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { sourceDay, targetDays, deliveryId } = req.body;
    
    // Convert days to lowercase to match our schema
    const sourceDayLower = sourceDay.toLowerCase();
    const targetDaysLower = targetDays.map(day => day.toLowerCase());
    
    const schedule = await TiffinSchedule.findOne({ user_id });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Find the source delivery
    const sourceDelivery = schedule.weekly_schedule[sourceDayLower]?.deliveries.id(deliveryId);
    if (!sourceDelivery) {
      return res.status(404).json({ error: 'Source delivery not found' });
    }
    
    // Copy to target days
    for (const day of targetDaysLower) {
      if (schedule.weekly_schedule[day]) {
        // Check if delivery with same vendor already exists
        const existingDelivery = schedule.weekly_schedule[day].deliveries.find(
          d => d.vendorId.toString() === sourceDelivery.vendorId.toString()
        );
        
        if (!existingDelivery) {
          schedule.weekly_schedule[day].deliveries.push({
            vendorId: sourceDelivery.vendorId,
            time: sourceDelivery.time,
            quantity: sourceDelivery.quantity
          });
          schedule.weekly_schedule[day].enabled = true;
        }
      }
    }
    
    schedule.updated_at = new Date();
    await schedule.save();
    
    // Populate vendor data
    const responseSchedule = JSON.parse(JSON.stringify(schedule));
    for (const dayName of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      if (responseSchedule.weekly_schedule[dayName] && responseSchedule.weekly_schedule[dayName].deliveries) {
        for (const deliveryItem of responseSchedule.weekly_schedule[dayName].deliveries) {
          if (deliveryItem.vendorId) {
            try {
              const vendorInfo = await TiffinVendor.findById(deliveryItem.vendorId);
              deliveryItem.vendorId = vendorInfo || { name: 'Unknown Vendor', price: 0 };
            } catch (err) {
              deliveryItem.vendorId = { name: 'Unknown Vendor', price: 0 };
            }
          }
        }
      }
    }
    
    res.json({ message: 'Delivery copied successfully', schedule: responseSchedule });
  } catch (err) {
    console.error('Error in copyDeliveryToMultipleDays:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update user's tiffin schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { weekly_schedule, holiday_mode } = req.body;
    
    const User = require('../models/User');
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let schedule = await TiffinSchedule.findOne({ user_id });
    
    if (!schedule) {
      schedule = new TiffinSchedule({
        user_id,
        user_name: user.name,
        weekly_schedule,
        holiday_mode: holiday_mode || { enabled: false }
      });
    } else {
      if (weekly_schedule) schedule.weekly_schedule = weekly_schedule;
      if (holiday_mode) schedule.holiday_mode = holiday_mode;
      schedule.updated_at = new Date();
    }
    
    await schedule.save();
    res.json({ message: 'Schedule updated successfully', schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users' schedules for dashboard
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await TiffinSchedule.find({}).sort({ user_name: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get delivery history for a user
exports.getDeliveries = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { days = 30 } = req.query;
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    const deliveries = await TiffinDelivery.find({
      user_id,
      delivery_date: { $gte: fromDateStr }
    })
    .populate('vendor_id', 'name price description')
    .sort({ delivery_date: -1 });
    
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all deliveries for system overview
exports.getAllDeliveries = async (req, res) => {
  try {
    const { days = 30, status, user_id } = req.query;
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    // Build query
    let query = { delivery_date: { $gte: fromDateStr } };
    
    if (status && status !== 'all') {
      if (status === 'delivered') {
        query.delivered = true;
      } else if (status === 'pending') {
        query.delivered = false;
        query.status = { $ne: 'cancelled' };
      } else if (status === 'cancelled') {
        query.status = 'cancelled';
      }
    }
    
    if (user_id && user_id !== 'all') {
      query.user_id = user_id;
    }
    
    const deliveries = await TiffinDelivery.find(query)
      .populate('vendor_id', 'name price description')
      .sort({ delivery_date: -1, scheduled_time: 1 });
    
    res.json({
      deliveries,
      total: deliveries.length,
      filters: { days, status: status || 'all', user_id: user_id || 'all' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get detailed history for a specific user
exports.getUserHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { days = 90, page = 1, limit = 50 } = req.query;
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get user info
    const User = require('../models/User');
    const user = await User.findById(user_id).select('name email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get deliveries with pagination
    const deliveries = await TiffinDelivery.find({
      user_id,
      delivery_date: { $gte: fromDateStr }
    })
    .populate('vendor_id', 'name price description')
    .sort({ delivery_date: -1, scheduled_time: 1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await TiffinDelivery.countDocuments({
      user_id,
      delivery_date: { $gte: fromDateStr }
    });
    
    // Calculate statistics
    const stats = await TiffinDelivery.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(user_id),
          delivery_date: { $gte: fromDateStr }
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$delivered', true] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalQuantity: { $sum: '$quantity' },
          totalSpent: {
            $sum: {
              $multiply: ['$quantity', { $ifNull: ['$vendor_id.price', 0] }]
            }
          }
        }
      }
    ]);
    
    const userStats = stats[0] || {
      totalDeliveries: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      totalQuantity: 0,
      totalSpent: 0
    };
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        hasNextPage: skip + deliveries.length < totalCount,
        hasPrevPage: parseInt(page) > 1
      },
      statistics: {
        ...userStats,
        deliveryRate: userStats.totalDeliveries > 0 
          ? ((userStats.deliveredCount / userStats.totalDeliveries) * 100).toFixed(1)
          : 0,
        avgQuantityPerDelivery: userStats.totalDeliveries > 0
          ? (userStats.totalQuantity / userStats.totalDeliveries).toFixed(1)
          : 0
      },
      period: `${days} days`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get history for all users
exports.getAllUsersHistory = async (req, res) => {
  try {
    const { days = 30, page = 1, limit = 100 } = req.query;
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get all deliveries with user and vendor info
    const deliveries = await TiffinDelivery.find({
      delivery_date: { $gte: fromDateStr }
    })
    .populate('vendor_id', 'name price description')
    .sort({ delivery_date: -1, scheduled_time: 1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await TiffinDelivery.countDocuments({
      delivery_date: { $gte: fromDateStr }
    });
    
    // Get user statistics
    const userStats = await TiffinDelivery.aggregate([
      {
        $match: {
          delivery_date: { $gte: fromDateStr }
        }
      },
      {
        $group: {
          _id: '$user_id',
          userName: { $first: '$user_name' },
          totalDeliveries: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$delivered', true] }, 1, 0] }
          },
          totalQuantity: { $sum: '$quantity' },
          lastDelivery: { $max: '$delivery_date' }
        }
      },
      {
        $project: {
          _id: 1,
          userName: 1,
          totalDeliveries: 1,
          deliveredCount: 1,
          totalQuantity: 1,
          lastDelivery: 1,
          deliveryRate: {
            $cond: [
              { $gt: ['$totalDeliveries', 0] },
              { $multiply: [{ $divide: ['$deliveredCount', '$totalDeliveries'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalDeliveries: -1 } }
    ]);
    
    // Get vendor statistics
    const vendorStats = await TiffinDelivery.aggregate([
      {
        $match: {
          delivery_date: { $gte: fromDateStr },
          vendor_id: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'tiffinvendors',
          localField: 'vendor_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: '$vendor_id',
          vendorName: { $first: '$vendor.name' },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$delivered', true] }, 1, 0] }
          }
        }
      },
      { $sort: { totalOrders: -1 } }
    ]);
    
    // System-wide statistics
    const systemStats = await TiffinDelivery.aggregate([
      {
        $match: {
          delivery_date: { $gte: fromDateStr }
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$delivered', true] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalQuantity: { $sum: '$quantity' },
          uniqueUsers: { $addToSet: '$user_id' },
          uniqueVendors: { $addToSet: '$vendor_id' }
        }
      },
      {
        $project: {
          totalDeliveries: 1,
          deliveredCount: 1,
          cancelledCount: 1,
          totalQuantity: 1,
          uniqueUsersCount: { $size: '$uniqueUsers' },
          uniqueVendorsCount: { $size: '$uniqueVendors' },
          deliveryRate: {
            $cond: [
              { $gt: ['$totalDeliveries', 0] },
              { $multiply: [{ $divide: ['$deliveredCount', '$totalDeliveries'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    res.json({
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        hasNextPage: skip + deliveries.length < totalCount,
        hasPrevPage: parseInt(page) > 1
      },
      systemStatistics: systemStats[0] || {
        totalDeliveries: 0,
        deliveredCount: 0,
        cancelledCount: 0,
        totalQuantity: 0,
        uniqueUsersCount: 0,
        uniqueVendorsCount: 0,
        deliveryRate: 0
      },
      userStatistics: userStats,
      vendorStatistics: vendorStats,
      period: `${days} days`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark tiffin as delivered
exports.markDelivered = async (req, res) => {
  try {
    const { delivery_id } = req.params;
    
    const delivery = await TiffinDelivery.findByIdAndUpdate(
      delivery_id,
      { 
        delivered: true, 
        delivered_at: new Date() 
      },
      { new: true }
    );
    
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    
    res.json({ message: 'Marked as delivered', delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    // Get all schedules
    const schedules = await TiffinSchedule.find({});
    
    // Get recent deliveries
    const recentDeliveries = await TiffinDelivery.find({
      delivery_date: { $gte: weekAgoStr }
    }).sort({ delivery_date: -1 });
    
    // Get today's scheduled deliveries
    const todayDeliveries = await TiffinDelivery.find({
      delivery_date: today
    });
    
    const stats = {
      total_users: schedules.length,
      today_scheduled: todayDeliveries.length,
      today_delivered: todayDeliveries.filter(d => d.delivered).length,
      week_total: recentDeliveries.length,
      week_delivered: recentDeliveries.filter(d => d.delivered).length,
      schedules,
      recent_deliveries: recentDeliveries.slice(0, 20)
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { days = 30 } = req.query;
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    // Get user deliveries
    const deliveries = await TiffinDelivery.find({
      user_id,
      delivery_date: { $gte: fromDateStr }
    }).sort({ delivery_date: -1 });
    
    // Calculate stats
    const totalDeliveries = deliveries.length;
    const deliveredCount = deliveries.filter(d => d.delivered).length;
    const pendingCount = deliveries.filter(d => !d.delivered && d.status === 'pending').length;
    const totalQuantity = deliveries.reduce((sum, d) => sum + (d.quantity || 1), 0);
    const deliveredQuantity = deliveries.filter(d => d.delivered).reduce((sum, d) => sum + (d.quantity || 1), 0);
    
    // Group by date for chart data
    const dailyStats = {};
    deliveries.forEach(delivery => {
      const date = delivery.delivery_date;
      if (!dailyStats[date]) {
        dailyStats[date] = { scheduled: 0, delivered: 0, quantity: 0 };
      }
      dailyStats[date].scheduled++;
      dailyStats[date].quantity += delivery.quantity || 1;
      if (delivery.delivered) {
        dailyStats[date].delivered++;
      }
    });
    
    const chartData = Object.keys(dailyStats).sort().map(date => ({
      date,
      scheduled: dailyStats[date].scheduled,
      delivered: dailyStats[date].delivered,
      quantity: dailyStats[date].quantity
    }));
    
    res.json({
      summary: {
        total_deliveries: totalDeliveries,
        delivered_count: deliveredCount,
        pending_count: pendingCount,
        delivery_rate: totalDeliveries > 0 ? (deliveredCount / totalDeliveries * 100).toFixed(1) : 0,
        total_quantity: totalQuantity,
        delivered_quantity: deliveredQuantity
      },
      chart_data: chartData,
      recent_deliveries: deliveries.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get system-wide analytics
exports.getSystemAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    // Get all deliveries in range
    const deliveries = await TiffinDelivery.find({
      delivery_date: { $gte: fromDateStr }
    }).sort({ delivery_date: -1 });
    
    // Get all schedules
    const schedules = await TiffinSchedule.find({});
    
    // Calculate system stats
    const totalUsers = schedules.length;
    const activeUsers = schedules.filter(s => {
      return Object.values(s.weekly_schedule).some(day => day.enabled);
    }).length;
    
    const totalDeliveries = deliveries.length;
    const deliveredCount = deliveries.filter(d => d.delivered).length;
    const totalQuantity = deliveries.reduce((sum, d) => sum + (d.quantity || 1), 0);
    
    // Group by user for comparison
    const userStats = {};
    deliveries.forEach(delivery => {
      const userId = delivery.user_id.toString();
      if (!userStats[userId]) {
        userStats[userId] = {
          user_name: delivery.user_name,
          total: 0,
          delivered: 0,
          quantity: 0
        };
      }
      userStats[userId].total++;
      userStats[userId].quantity += delivery.quantity || 1;
      if (delivery.delivered) {
        userStats[userId].delivered++;
      }
    });
    
    const userComparison = Object.values(userStats).map(user => ({
      ...user,
      delivery_rate: user.total > 0 ? (user.delivered / user.total * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);
    
    // Daily trends
    const dailyTrends = {};
    deliveries.forEach(delivery => {
      const date = delivery.delivery_date;
      if (!dailyTrends[date]) {
        dailyTrends[date] = { scheduled: 0, delivered: 0, quantity: 0, users: new Set() };
      }
      dailyTrends[date].scheduled++;
      dailyTrends[date].quantity += delivery.quantity || 1;
      dailyTrends[date].users.add(delivery.user_id.toString());
      if (delivery.delivered) {
        dailyTrends[date].delivered++;
      }
    });
    
    const trendData = Object.keys(dailyTrends).sort().map(date => ({
      date,
      scheduled: dailyTrends[date].scheduled,
      delivered: dailyTrends[date].delivered,
      quantity: dailyTrends[date].quantity,
      active_users: dailyTrends[date].users.size
    }));
    
    res.json({
      summary: {
        total_users: totalUsers,
        active_users: activeUsers,
        total_deliveries: totalDeliveries,
        delivered_count: deliveredCount,
        system_delivery_rate: totalDeliveries > 0 ? (deliveredCount / totalDeliveries * 100).toFixed(1) : 0,
        total_quantity: totalQuantity,
        avg_daily_deliveries: trendData.length > 0 ? (totalDeliveries / trendData.length).toFixed(1) : 0
      },
      user_comparison: userComparison,
      trend_data: trendData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get delivery trends
exports.getDeliveryTrends = async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, quarter
    
    let days;
    switch (period) {
      case 'month': days = 30; break;
      case 'quarter': days = 90; break;
      default: days = 7; break;
    }
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    const deliveries = await TiffinDelivery.find({
      delivery_date: { $gte: fromDateStr }
    }).sort({ delivery_date: 1 });
    
    // Group by time period
    const trends = {};
    deliveries.forEach(delivery => {
      let key;
      const date = new Date(delivery.delivery_date);
      
      if (period === 'week') {
        key = delivery.delivery_date;
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      }
      
      if (!trends[key]) {
        trends[key] = { scheduled: 0, delivered: 0, cancelled: 0, quantity: 0 };
      }
      
      trends[key].scheduled++;
      trends[key].quantity += delivery.quantity || 1;
      
      if (delivery.delivered) {
        trends[key].delivered++;
      } else if (delivery.status === 'cancelled') {
        trends[key].cancelled++;
      }
    });
    
    const trendArray = Object.keys(trends).sort().map(key => ({
      period: key,
      ...trends[key],
      delivery_rate: trends[key].scheduled > 0 ? 
        (trends[key].delivered / trends[key].scheduled * 100).toFixed(1) : 0
    }));
    
    res.json({
      period,
      data: trendArray,
      summary: {
        total_periods: trendArray.length,
        avg_scheduled: trendArray.length > 0 ? 
          (trendArray.reduce((sum, t) => sum + t.scheduled, 0) / trendArray.length).toFixed(1) : 0,
        avg_delivered: trendArray.length > 0 ? 
          (trendArray.reduce((sum, t) => sum + t.delivered, 0) / trendArray.length).toFixed(1) : 0,
        overall_rate: trendArray.length > 0 ? 
          (trendArray.reduce((sum, t) => sum + parseFloat(t.delivery_rate), 0) / trendArray.length).toFixed(1) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
