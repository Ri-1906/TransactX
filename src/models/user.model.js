const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required : [true, "Email required to create the account"],
        trim : true,
        unique : [true, "Email id already exists"],
        lowercase : true,
        match : [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    name : {
        type : String,
        required : [true, "Please fill the name"]
    },
    password : {
        type : String,
        required : [true, "Please fill the password to create account"],
        minlength : [6, "Passwords should be minimum six characters"],
        select : false
    }
}, {
    timestamps : true
})


userSchema.pre("save", async function () {
    
    if(!this.isModified("password")){
        return 
    }

    const hash = await bcrypt.hash(this.password,10)
    this.password = hash
    return 

})

userSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user",userSchema)

module.exports = userModel