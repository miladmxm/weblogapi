const jwt = require('jsonwebtoken');

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
