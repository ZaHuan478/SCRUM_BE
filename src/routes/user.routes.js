const express = require('express');
const userController = require('../controllers/user.controller');
const {
  authenticate,
  authorize,
  authorizeOwnerOrRoles,
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), userController.createUser);
router.get('/', authorize('ADMIN'), userController.getAllUsers);
router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateCurrentUser);
router.post('/me/avatar', userController.uploadCurrentUserAvatar);
router.delete('/me', userController.softDeleteCurrentUser);
router.get('/:id', authorizeOwnerOrRoles('id', 'ADMIN'), userController.getUserById);
router.put('/:id', authorizeOwnerOrRoles('id', 'ADMIN'), userController.updateUser);
router.patch('/:id/status', authorize('ADMIN'), userController.changeUserStatus);
router.delete('/:id', authorize('ADMIN'), userController.softDeleteUser);

module.exports = router;
