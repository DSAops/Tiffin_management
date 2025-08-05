const express = require('express');
const router = express.Router();
const userTaskController = require('../controllers/userTaskController');

router.post('/', userTaskController.assignTaskToUser);
router.patch('/:id/update_counter', userTaskController.updateUserTaskCounter);
router.patch('/:id/pause', userTaskController.pauseUserTask);
router.patch('/:id/resume', userTaskController.resumeUserTask);
router.get('/:task_id/users', userTaskController.getUserTasksForTask);
router.get('/:user_id/tasks', userTaskController.getUserTasksForUser);

module.exports = router;
