const {Router} = require('express');
const adminController = require('../controllers/adminController');
const {authenticated} = require('../middlewares/auth');
const router = new Router()



// @desc get all posts
// @desc get /dashboard/
router.get('/:id',authenticated,adminController.getPost)

// @desc delete post page and handler
// @desc get /dashboard/delete-post/3546354asdfsdh52
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



module.exports = router