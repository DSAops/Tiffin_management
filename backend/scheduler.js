const TiffinSchedule = require('./models/TiffinSchedule');
const TiffinDelivery = require('./models/TiffinDelivery');

class TiffinScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🍱 Tiffin Scheduler started');
    
    // Run immediately
    this.processSchedules();
    
    // Run every hour
    this.interval = setInterval(() => {
      this.processSchedules();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    console.log('🍱 Tiffin Scheduler stopped');
  }

  // Process all schedules and create deliveries
  async processSchedules() {
    try {
      console.log('🔄 Processing tiffin schedules...');
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = this.getDayOfWeek(today);
      
      // Get all active schedules with vendor information
      const schedules = await TiffinSchedule.find({}).populate('weekly_schedule.monday.deliveries.vendorId weekly_schedule.tuesday.deliveries.vendorId weekly_schedule.wednesday.deliveries.vendorId weekly_schedule.thursday.deliveries.vendorId weekly_schedule.friday.deliveries.vendorId weekly_schedule.saturday.deliveries.vendorId weekly_schedule.sunday.deliveries.vendorId');
      
      let processedCount = 0;
      let createdCount = 0;
      
      for (const schedule of schedules) {
        try {
          // Check if user is in holiday mode
          if (this.isInHolidayMode(schedule, todayStr)) {
            console.log(`⏸️ Skipping ${schedule.user_name} - Holiday mode active`);
            continue;
          }
          
          // Check if today is enabled for this user
          const daySchedule = schedule.weekly_schedule[dayOfWeek];
          if (!daySchedule || !daySchedule.enabled || !daySchedule.deliveries || daySchedule.deliveries.length === 0) {
            continue;
          }
          
          // Process each delivery for this day
          for (const deliveryConfig of daySchedule.deliveries) {
            // Check if delivery already exists for today with this vendor
            const existingDelivery = await TiffinDelivery.findOne({
              user_id: schedule.user_id,
              delivery_date: todayStr,
              vendor_id: deliveryConfig.vendorId
            });
            
            if (existingDelivery) {
              continue; // Already scheduled
            }
            
            // Create new delivery
            const delivery = new TiffinDelivery({
              user_id: schedule.user_id,
              user_name: schedule.user_name,
              delivery_date: todayStr,
              scheduled_time: deliveryConfig.time || "12:00",
              quantity: deliveryConfig.quantity || 1,
              vendor_id: deliveryConfig.vendorId,
              delivered: false
            });
            
            await delivery.save();
            createdCount++;
            console.log(`✅ Scheduled tiffin for ${schedule.user_name} from vendor ${deliveryConfig.vendorId} at ${deliveryConfig.time}`);
          }
          
        } catch (err) {
          console.error(`❌ Error processing schedule for ${schedule.user_name}:`, err.message);
        }
        
        processedCount++;
      }
      
      console.log(`📊 Processed ${processedCount} schedules, created ${createdCount} new deliveries`);
      
    } catch (err) {
      console.error('❌ Error in processSchedules:', err.message);
    }
  }

  // Check if user is in holiday mode
  isInHolidayMode(schedule, todayStr) {
    const holidayMode = schedule.holiday_mode;
    
    if (!holidayMode || !holidayMode.enabled) {
      return false;
    }
    
    const startDate = holidayMode.start_date;
    const endDate = holidayMode.end_date;
    
    if (!startDate || !endDate) {
      return false;
    }
    
    // Check if today is within holiday period
    return todayStr >= startDate && todayStr <= endDate;
  }

  // Get day of week as string
  getDayOfWeek(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  // Auto-mark deliveries as delivered (for testing/simulation)
  async autoMarkDelivered() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      
      // Find deliveries scheduled for today that should be delivered by now
      const deliveries = await TiffinDelivery.find({
        delivery_date: today,
        delivered: false
      });
      
      let markedCount = 0;
      
      for (const delivery of deliveries) {
        const [scheduleHour] = delivery.scheduled_time.split(':').map(Number);
        
        // If current time is past scheduled time + 1 hour, mark as delivered
        if (currentHour >= scheduleHour + 1) {
          delivery.delivered = true;
          delivery.delivered_at = new Date();
          await delivery.save();
          markedCount++;
          console.log(`📦 Auto-marked delivery for ${delivery.user_name} as delivered`);
        }
      }
      
      if (markedCount > 0) {
        console.log(`📊 Auto-marked ${markedCount} deliveries as delivered`);
      }
      
    } catch (err) {
      console.error('❌ Error in autoMarkDelivered:', err.message);
    }
  }

  // Get status report
  async getStatusReport() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const totalSchedules = await TiffinSchedule.countDocuments({});
      const todayDeliveries = await TiffinDelivery.countDocuments({ delivery_date: today });
      const todayDelivered = await TiffinDelivery.countDocuments({ 
        delivery_date: today, 
        delivered: true 
      });
      
      return {
        total_schedules: totalSchedules,
        today_scheduled: todayDeliveries,
        today_delivered: todayDelivered,
        success_rate: todayDeliveries > 0 ? Math.round((todayDelivered / todayDeliveries) * 100) : 0
      };
    } catch (err) {
      console.error('❌ Error getting status report:', err.message);
      return { error: err.message };
    }
  }
}

// Export singleton instance
module.exports = new TiffinScheduler();
