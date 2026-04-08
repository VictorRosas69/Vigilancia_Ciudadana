const express = require('express');
const router = express.Router();
const { getStats, getUsers, toggleUserStatus, updateUserRole, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación + rol admin
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/dashboard', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
