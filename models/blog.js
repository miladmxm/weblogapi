const mongoose = require('mongoose');

const {addPostValidatorSchema,contactSchemaValidator} = require('./schemaValidate');

const blogShema = new mongoose.Schema({
    title:{
        type: String,
        trim:true,
        required:true,
        minlength:4,
        maxlength:255
    },
    body:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:'public',
        enum:['public','private'],
    },
    thumbnail:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    category:{
        type:String,
        default:'دیگر'
    }
})

blogShema.index({title:'text'})

blogShema.statics.postValidation = function(body){
    return addPostValidatorSchema.validate(body,{abortEarly:false})
}

blogShema.statics.contactValidator = function(body){
    return contactSchemaValidator.validate(body,{abortEarly:false})
}

blogShema.pre('save',function(next){
    const blog = this
    blog.title = blog.title.replace(/[^a-zA-Zا-ی0-9 ]/g, "");
    if(!blog.status){
        blog.status = 'public'
    }    
    next()
})

module.exports = mongoose.model("Blog",blogShema)