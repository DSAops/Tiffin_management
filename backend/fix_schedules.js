require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL;

async function fixSchedules() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    // Use raw MongoDB operations to avoid Mongoose schema validation issues
    const db = mongoose.connection.db;
    const collection = db.collection('tiffinschedules');

    // Get all schedules using raw MongoDB
    const schedules = await collection.find({}).toArray();
    console.log(`Found ${schedules.length} schedules to check`);

    let fixedCount = 0;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const schedule of schedules) {
      let needsUpdate = false;
      const updates = {};

      // Check if weekly_schedule exists
      if (!schedule.weekly_schedule) {
        updates.weekly_schedule = {};
        needsUpdate = true;
      }

      // Fix each day
      for (const day of days) {
        const dayPath = `weekly_schedule.${day}`;
        const daySchedule = schedule.weekly_schedule ? schedule.weekly_schedule[day] : null;
        
        // If day is missing, false, or not an object, fix it
        if (!daySchedule || typeof daySchedule !== 'object' || Array.isArray(daySchedule)) {
          console.log(`Fixing ${day} for user ${schedule.user_name || schedule.user_id}`);
          updates[dayPath] = {
            enabled: false,
            deliveries: []
          };
          needsUpdate = true;
        } else {
          // Check if deliveries array exists and is valid
          if (!Array.isArray(daySchedule.deliveries)) {
            console.log(`Fixing deliveries array for ${day} for user ${schedule.user_name || schedule.user_id}`);
            updates[`${dayPath}.deliveries`] = [];
            needsUpdate = true;
          }
          
          // Check if enabled is boolean
          if (typeof daySchedule.enabled !== 'boolean') {
            updates[`${dayPath}.enabled`] = false;
            needsUpdate = true;
          }
        }
      }

      // Fix holiday_mode if needed
      if (!schedule.holiday_mode || typeof schedule.holiday_mode !== 'object') {
        updates.holiday_mode = {
          enabled: false,
          start_date: '',
          end_date: '',
          reason: 'Holiday'
        };
        needsUpdate = true;
      }

      // Update using raw MongoDB operations
      if (needsUpdate) {
        await collection.updateOne(
          { _id: schedule._id },
          { $set: updates }
        );
        fixedCount++;
        console.log(`✅ Fixed schedule for ${schedule.user_name || schedule.user_id}`);
      }
    }

    console.log(`🎉 Fixed ${fixedCount} schedules out of ${schedules.length} total`);
    
  } catch (error) {
    console.error('❌ Error fixing schedules:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the fix
fixSchedules();
