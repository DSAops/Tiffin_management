const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tiffinController = require('../controllers/tiffinController');

// Schedule routes
router.get('/schedule/:user_id', auth, tiffinController.getSchedule);
router.put('/schedule/:user_id', auth, tiffinController.updateSchedule);
router.get('/schedules', auth, tiffinController.getAllSchedules);

// Delivery management routes
router.post('/schedule/:user_id/day/:day/delivery', auth, tiffinController.addDeliveryToDay);
router.delete('/schedule/:user_id/day/:day/delivery/:delivery_id', auth, tiffinController.removeDeliveryFromDay);

// Delivery history routes
router.get('/deliveries/:user_id', auth, tiffinController.getDeliveries);
router.patch('/delivery/:delivery_id/delivered', auth, tiffinController.markDelivered);

// Analytics routes
router.get('/dashboard/stats', auth, tiffinController.getDashboardStats);
router.get('/analytics/:user_id', auth, tiffinController.getUserAnalytics);
router.get('/analytics/system/overview', auth, tiffinController.getSystemAnalytics);
router.get('/analytics/trends', auth, tiffinController.getDeliveryTrends);

module.exports = router;
