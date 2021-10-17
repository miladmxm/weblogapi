const {Router} = require('express');
const userController = require('../controllers/userController');
const {authenticated,notAuthenticated} =require('../middlewares/auth');

const router = new Router()


// @desc login handler
// @desc post /users/login
router.post('/login',userController.loginHandler)


// @desc register handler
// @desc get /users/register
router.post('/register',userController.registerHandler)


// @desc forget password page
// @desc get /users/forget-pass
router.post('/forget-pass',userController.handleForgetPass)

// @desc reset password handler
// @desc post /users/reset-pass/:userId
router.post('/reset-pass/:token',userController.handleResetPass)



module.exports = router