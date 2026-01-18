const express = require('express');
const usersController = require('../controllers/users');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validation.middleware');
const updateUserSchema = require('../dto/update-user.dto');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

// All routes in this file are protected
router.use(authMiddleware);

router.post('/:id', fileUpload.single('avatar'), validate(updateUserSchema), usersController.updateUser);
router.get('/all-users', usersController.getAllUsers);
router.post('/:id/promote', usersController.promoteUserToAdmin);
router.post('/:id/demote', usersController.demoteAdminToUser);
router.delete('/:id', usersController.adminDeleteUser);

module.exports = router;
