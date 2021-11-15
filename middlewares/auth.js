const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.authenticated = (req,res,next)=>{
    const tokenHeader = req.get("Authorization")
    try {
        if(!tokenHeader){
            const error = new Error("شما مجوز دسترسی به این بخش رو ندارید");
            error.statusCode = 401;
            throw error
        }
        const token = tokenHeader.split(" ")[1];
        const decodedToken = jwt.verify(token,process.env.JWT_SECRET)
        if(!decodedToken){
            const error = new Error("شما مجوز دسترسی به این بخش رو ندارید");
            error.statusCode = 401;
            throw error
        }
        req.userId = decodedToken.user.userId
        next()
    } catch (err) {
        if(err.name === 'JsonWebTokenError'){
            err.statusCode = 401;
            err.message = "شما مجوز دسترسی به این بخش رو ندارید"
        }
        next(err)
    }
}

exports.authenticatedAdmin =async (req,res,next)=>{
    const tokenHeader = req.get("Authorization")
    try {
        if(!tokenHeader){
            const error = new Error("شما مجوز دسترسی به این بخش رو ندارید");
            error.statusCode = 401;
            throw error
        }
        const token = tokenHeader.split(" ")[1];
        const decodedToken = jwt.verify(token,process.env.JWT_SECRET)
        if(!decodedToken){
            const error = new Error("شما مجوز دسترسی به این بخش رو ندارید");
            error.statusCode = 401;
            throw error
        }
        const isAdmin = await User.findOne({ _id: decodedToken.user.userId, isAdmin: true })
        if (!isAdmin) {
            const error = new Error("شما مجوز دسترسی به این بخش رو ندارید");
            error.statusCode = 401;
            throw error
        }
        next()
    } catch (err) {
        if(err.name === 'JsonWebTokenError'){
            err.statusCode = 401;
            err.message = "شما مجوز دسترسی به این بخش رو ندارید"
        }
        next(err)
    }
}
