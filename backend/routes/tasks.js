const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask);
router.get('/:flat_id', taskController.getTasksByFlat);
router.patch('/:task_id', taskController.updateTask);
router.delete('/:task_id', taskController.deleteTask);

module.exports = router;
