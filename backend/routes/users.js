
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// Signup
router.post('/signup', userController.signupValidators, userController.signup);
// Login
router.post('/login', userController.loginValidators, userController.login);

module.exports = router;
