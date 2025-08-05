const express = require('express');
const router = express.Router();
const tiffinController = require('../controllers/tiffinController');

// Schedule routes - no auth needed, just pass user_id
router.get('/schedule/:user_id', tiffinController.getSchedule);
router.put('/schedule/:user_id', tiffinController.updateSchedule);
router.get('/schedules', tiffinController.getAllSchedules);

// Delivery management routes - no auth needed
router.post('/schedule/:user_id/day/:day/delivery', tiffinController.addDeliveryToDay);
router.put('/schedule/:user_id/day/:day/delivery/:delivery_id', tiffinController.editDeliveryInDay);
router.delete('/schedule/:user_id/day/:day/delivery/:delivery_id', tiffinController.removeDeliveryFromDay);
router.post('/schedule/:user_id/copy-delivery', tiffinController.copyDeliveryToMultipleDays);

// Delivery history routes - no auth needed
router.get('/deliveries/:user_id', tiffinController.getDeliveries);
router.get('/deliveries', tiffinController.getAllDeliveries);
router.get('/history/user/:user_id', tiffinController.getUserHistory);
router.get('/history/all', tiffinController.getAllUsersHistory);
router.patch('/delivery/:delivery_id/delivered', tiffinController.markDelivered);

// Analytics routes - no auth needed
router.get('/dashboard/stats', tiffinController.getDashboardStats);
router.get('/analytics/:user_id', tiffinController.getUserAnalytics);
router.get('/analytics/system/overview', tiffinController.getSystemAnalytics);
router.get('/analytics/trends', tiffinController.getDeliveryTrends);

module.exports = router;
