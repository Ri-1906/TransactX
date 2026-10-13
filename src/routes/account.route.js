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


/**
 * - GET /api/accounts
 * - Get all accounts of logged-in user
 * - Protected
 */

router.get('/',authMiddleware.authMiddleware,accountController.getUserAccountsController)


/**
 * - GET /api/accounts/balance/:accountId
 */

router.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getBalanceController)



module.exports = router