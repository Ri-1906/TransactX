const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const emailService = require('../services/email.service')

/**
 * @name UserRegisterController
 * @description register the user using name,email and password
 * @access public
 */

async function userRegisterController(req,res){

    const {email , name , password} = req.body;

    const isExists = await userModel.findOne({
        email : email
    })

    if(isExists){
        return res.status(422).json({
            message : "USer already exists with this email",
            status : "failed"
        })
    }

    const user = await userModel.create(
        {email, name , password}
    )

    const token = jwt.sign({userId: user._id},process.env.JWT_SECRET , {expiresIn: "3d"})

    res.cookie("token",token)

    res.status(201).json({
        message : "USer created succesfully",
        user : {
            _id : user._id,
            email : user.email,
            name: user.name
        },
        token
    })

    await emailService.sendRegistraionEmail(user.email,user.name)




}

/**
 * @name UserLoginController
 * @description login the user with email and password
 * @access public
 */
async function userLoginController(req,res){

    const {email , password} = req.body;

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message : "Invalid email or password"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message : "Invalid password"
        })
    }

    const token = jwt.sign({userId: user._id},process.env.JWT_SECRET , {expiresIn: "3d"})
    
    res.cookie("token",token)

    res.status(200).json({
        message : "User created succesfully",
        user : {
            _id : user._id,
            email : user.email,
            name: user.name
        },
        token
    })



}

module.exports = {userRegisterController, userLoginController}