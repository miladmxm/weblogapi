const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const {userSchemaValidator} = require('./schemaValidate');
const userSchema = new mongoose.Schema({
    fullname:{
        type:String,
        required:true,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:true,
        minLength:4,
        maxLength:255
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})



userSchema.statics.userValidation = function(body){
    return userSchemaValidator.validate(body,{abortEarly:false})
}

userSchema.pre('save',function(next){
    const user = this
    if(!user.isModified('password')) return next()
    
    bcrypt.hash(user.password,10,(err,hash)=>{
        if(err) return next(err)
        user.password = hash;
        next()
    })
})

module.exports=mongoose.model("User",userSchema)