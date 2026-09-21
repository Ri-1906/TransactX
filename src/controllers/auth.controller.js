const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')

/**
 * @name UserRegisterController
 * @description register the user using name,email and password
 * @access public
 */

async function userRegisterController(req,res){

    const {email , name , password} = req.body();

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

    res.cookies("token",token)

    res.status(201).json({
        message : "USer created succesfully",
        user : {
            _id : user._id,
            email : user.email,
            name: user.name
        },
        token
    })



}

module.exports = {userRegisterController}