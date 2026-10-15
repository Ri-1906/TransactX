const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()

app.use(express.json())
app.use(cookieParser())

/**
 * - Routes
 */
const authRouter = require('./routes/auth.routes')
const accountRouter = require('./routes/account.route')
const transactionRouter = require('./routes/transaction.routes')
/**
 * - Use Routes
 */
app.get("/",(req,res)=>{
    res.send("Ledger service is up and running")
})

app.use("/api/auth", authRouter)
app.use('/api/accounts',accountRouter)
app.use('/api/transactions',transactionRouter)

module.exports = app