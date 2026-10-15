const express = require('express')
const authController = require('../controllers/auth.controller')

const router = express.Router()


/**
 * - POST /api/auth/register
 * - Register a user
 */
router.post('/register', authController.userRegisterController)

/**
 * - POST /api/auth/login
 * - Login an existing user
 */
router.post('/login',authController.userLoginController)

/**
 * - POST /api/auth/logout
 * - Logout the user
 */
router.post('/logout', authController.userLogoutController)



module.exports = router