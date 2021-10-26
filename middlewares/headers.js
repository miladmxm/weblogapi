exports.setHeaders = (req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, PUT')
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization')
    res.setHeader('X-Powered-By','no no no')
    next()
}