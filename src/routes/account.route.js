const express = require('express')
const authMiddleware = require("../middlewares/auth.middleware")
const accountController = require("../controllers/account.controller")
const router = express.Router()

/**
 * - POST /api/account
 * @description create a new account 
 * @access protected
 */

router.post("/",authMiddleware.authMiddleware, accountController.createAccountController )




module.exports = router