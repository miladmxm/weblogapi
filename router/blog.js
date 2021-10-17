const { Router } = require("express");
const blogController = require("../controllers/blogController");

const router = new Router();

// @desc index weblog route
// @desc get /
router.get("/", blogController.getIndex);

// @desc show single post
// @desc get /blog/1as5dg7a2sf7g
router.get("/blog/:id", blogController.singlePost);


// @desc contact us handler and send email
// @desc post /contact
router.post("/contact", blogController.contactHandler);


// @desc show captcha png
// @desc get /captcha.png
router.get("/captcha.png", blogController.numberCaptcha);


module.exports = router;
