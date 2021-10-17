exports.setHeaders = (req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Method','GET, POST, DELET, PUT')
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization')
    res.setHeader('X-Powered-By','no no no')
    next()
}