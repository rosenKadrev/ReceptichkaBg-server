const express = require('express');
const usersController = require('../controllers/users');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validation.middleware');
const updateUserSchema = require('../dto/update-user.dto');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/profile/:id', usersController.getProfileById);

// All routes in this file are protected
router.use(authMiddleware);

router.post('/:id', fileUpload.single('avatar'), validate(updateUserSchema), usersController.updateUser);
router.get('/all-users', requireRole('admin', 'super_admin'), usersController.getAllUsers);
router.post('/:id/promote', requireRole('super_admin'), usersController.promoteUserToAdmin);
router.post('/:id/demote', requireRole('super_admin'), usersController.demoteAdminToUser);
router.patch('/:id/dark-mode', usersController.updateDarkMode);
router.delete('/:id', requireRole('admin', 'super_admin'), usersController.adminDeleteUser);

module.exports = router;