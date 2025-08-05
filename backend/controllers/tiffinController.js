const TiffinSchedule = require('../models/TiffinSchedule');
const TiffinDelivery = require('../models/TiffinDelivery');
const TiffinVendor = require('../models/TiffinVendor');

// Get user's tiffin schedule
exports.getSchedule = async (req, res) => {
  try {
    const { user_id } = req.params;
    let schedule = await TiffinSchedule.findOne({ user_id })
      .populate('weekly_schedule.monday.deliveries.vendorId')
      .populate('weekly_schedule.tuesday.deliveries.vendorId')
      .populate('weekly_schedule.wednesday.deliveries.vendorId')
      .populate('weekly_schedule.thursday.deliveries.vendorId')
      .populate('weekly_schedule.friday.deliveries.vendorId')
      .populate('weekly_schedule.saturday.deliveries.vendorId')
      .populate('weekly_schedule.sunday.deliveries.vendorId');
    
    if (!schedule) {
      // Create default schedule if doesn't exist
      const User = require('../models/User');
      const user = await User.findById(user_id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      schedule = new TiffinSchedule({
        user_id,
        user_name: user.name,
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
    
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add delivery to a specific day
exports.addDeliveryToDay = async (req, res) => {
  try {
    const { user_id, day } = req.params;
    const { vendorId, time, quantity } = req.body;
    
    // Validate vendor exists
    const vendor = await TiffinVendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // Get user schedule
    let schedule = await TiffinSchedule.findOne({ user_id });
    if (!schedule) {
      const User = require('../models/User');
      const user = await User.findById(user_id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      schedule = new TiffinSchedule({
        user_id,
        user_name: user.name
      });
    }
    
    // Add delivery to the specified day
    if (!schedule.weekly_schedule[day]) {
      return res.status(400).json({ error: 'Invalid day specified' });
    }
    
    const newDelivery = { vendorId, time, quantity: quantity || 1 };
    schedule.weekly_schedule[day].deliveries.push(newDelivery);
    schedule.weekly_schedule[day].enabled = true; // Enable the day when adding delivery
    schedule.updated_at = new Date();
    
    await schedule.save();
    
    // Populate the added delivery with vendor details
    await schedule.populate(`weekly_schedule.${day}.deliveries.vendorId`);
    
    res.json({ 
      message: 'Delivery added successfully', 
      schedule,
      addedDelivery: schedule.weekly_schedule[day].deliveries[schedule.weekly_schedule[day].deliveries.length - 1]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove delivery from a specific day
exports.removeDeliveryFromDay = async (req, res) => {
  try {
    const { user_id, day, delivery_id } = req.params;
    
    const schedule = await TiffinSchedule.findOne({ user_id });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    if (!schedule.weekly_schedule[day]) {
      return res.status(400).json({ error: 'Invalid day specified' });
    }
    
    // Remove the delivery
    schedule.weekly_schedule[day].deliveries = schedule.weekly_schedule[day].deliveries.filter(
      delivery => delivery._id.toString() !== delivery_id
    );
    
    // If no deliveries left, disable the day
    if (schedule.weekly_schedule[day].deliveries.length === 0) {
      schedule.weekly_schedule[day].enabled = false;
    }
    
    schedule.updated_at = new Date();
    await schedule.save();
    
    res.json({ message: 'Delivery removed successfully', schedule });
  } catch (err) {
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
    }).sort({ delivery_date: -1 });
    
    res.json(deliveries);
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
