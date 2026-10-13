const transactionModel = require('../models/transaction.model')
const ledgerModel = require("../models/ledger.model")
const accountModel = require('../models/account.model')
const emaileService = require("../services/email.service") 
const mongoose = require("mongoose")

/**
 * - create new transaction
 * The transfer flow:
 * 1. validate request
 * 2. validate idempotency key
 * 3. check account status
 * 4. derive sender balance from ledger
 * 5. create a transaction (PENDING)
 * 6. create DEBIT ledger netry
 * 7. create CREDIT ledger entry
 * 8. mark transaction as COMPLETED
 * 9. commit MongoDB session
 * 10. Send email notification
 */


async function createTransaction(req,res){

    /**
     * - Validate request
     */

    const {fromAccount, toAccount, amount, idempotencyKey} = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message : "Missing values"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id : toAccount,
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message : "Inavlid account values"
        })
    }

    /**
     * - Validate idempotency Key
     */

    const isTransactionExist = await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    })

    if(isTransactionExist){
        if(isTransactionExist.status === "COMPLETED"){
            return res.status(200).json({
                message : "Transaction already processed",
                transaction: isTransactionExist
            })
        }

        if(isTransactionExist.status === "PENDING"){
            return res.status(200).json({
                message : "Transaction is still in processing"
            })
        }

        if(isTransactionExist.status === "FAILED"){
            return res.status(500).json({
                message : "Transaction proessing failed. Please retry."
            })
        }

        if(isTransactionExist.status === "REVERSED"){
            return res.status(500).json({
                message : "Transaction was reversed."
            })
        }



        /**
         * - Check Account Status
         */

        if(fromUserAccount.status != "ACTIVE" || toUserAccount.status != "ACTIVE"){
            return res.status(400).json({
                message : "Accounts must be ACTIVE in order to process transaction"
            })
        }

    }

    /**
     * Derive sender balance from ledger
     */

     const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance.\n Current Balance : ${balance}\nRequested Amount : ${amount}`
        })
    }

    /**
     * Create transaction (PENDING)
     */
    // 5 to 8 yaa to saare complete honge ya ek b nhi 

    const session = await mongoose.startSession()
    session.startTransaction() //provided by mongoose ki iske aage jo b hga either fully or nothing (Atomic)

    const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status : "PENDING"
    })

    /**
     * - Create Debit ledger entry
     */


    const debitLedgerEntry = await ledgerModel.create([{
        account : fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }],{session})

    /**
     * - Create Credit Ledger Entry
     */

    const crebitLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], {session})

    /**
     * - Mark transaction as Complete
     */

    transaction.status = "COMPLETED"
    session.endSession()

    /**
     * Send Email Notification
     */

    await emaileService.sendTransactionEmail(
        req.user.email, req.user.name,amount, toAccount
    )

    return res.status(201).json({
        message : "Transaction Completed Sucessfully",
        transaction : transaction
    })




}


async function createInitialFundsTransaction(req,res){
    const {toAccount,amount,idempotencyKey} = req.body
    
    if( !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message : "Missing values"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id : toAccount,
    })

    if(!toUserAccount){
        return res.status(400).json({
            message : "Inavlid account"
        })
    }

    const fromUserAccount = await accountModel.findOne({
      
        user: req.user._id
    })

    if(!fromUserAccount){
        return res.status(400).json({
            message : "User Account not found"
        })
    }
     
    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING",

    })

    const debitLedgerEntry = await ledgerModel.create([{
        account : fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }],{session})

    const crebitLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], {session})

    transaction.status = "COMPLETED"
    await transaction.save({session})
    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfulyy",
        transaction: transaction
    })

}

module.exports = {
    createTransaction , createInitialFundsTransaction
}