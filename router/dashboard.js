const {Router} = require('express');
const adminController = require('../controllers/adminController');
const {authenticated, authenticatedAdmin} = require('../middlewares/auth');
const router = new Router()


// @desc image upload
// @desc post /dashboard/image-upload
router.get('/get-all-user', authenticated, adminController.getAllUsers)

// @desc get all posts
// @desc get /dashboard/
router.get('/:id',authenticated,adminController.getPost)

// @desc delete user handler
// @desc delete /dashboard/delete-post-by-admin/3546354asdfsdh52
router.delete('/delete-user-by-admin/:id', authenticated, adminController.deleteUserByAdmin)

// @desc delete post handler
// @desc delete /dashboard/delete-post/3546354asdfsdh52
router.delete('/delete-post/:id',authenticated,adminController.deletePost)

// @desc edit post handler
// @desc post /dashboard/edit-post/3546354asdfsdh52
router.put('/edit-post/:id',authenticated,adminController.editPost)

// @desc add a new post
// @desc post /dashboard/add-post
router.post('/add-post',authenticated,adminController.createPost)

// @desc image upload
// @desc post /dashboard/image-upload
router.post('/image-upload',authenticated,adminController.uploadImage)

// @desc edit user
// @desc put /dashboard/edit-user
router.put('/edit-user/:id',authenticated,adminController.editProfile)

// @desc delete user handler
// @desc delete /dashboard/delete-user
router.post('/delete-user/:token', authenticated, adminController.deleteUserReq)

// @desc image upload
// @desc post /dashboard/image-upload
router.get('/all-image-user/:email',authenticated,adminController.getAllImgUser)

// @desc add user handler
// @desc post /dashboard/add-user
router.post('/add-user', authenticatedAdmin, adminController.addUser)

module.exports = router