const captchapng = require('captchapng');

const Blog = require("../models/blog");
const { resevEmail } = require("../utils/mailer");

let CAPTCHA_PNG_NUM;

exports.getIndex = async (req, res, next) => {
  try {
    const numberOfPost = await Blog.find({ status: "public" }).countDocuments();
    const posts = await Blog.find({ status: "public" })
      .populate("user")
      .sort({ createdAt: "desc" })
    if (!posts) {
      const error = new Error("هیچ پستی وجود ندارد در پایگاه داده")
      error.statusCode = 404
      throw error
    }
    const filterpost = posts.map(post => {
      return {
        status: post.status,
        category: post.category,
        _id: post._id,
        title: post.title,
        body: post.body,
        thumbnail: post.thumbnail,
        user: {
          profileImg: post.user.profileImg,
          bio: post.user.bio,
          _id: post.user._id,
          fullname: post.user.fullname,
          emailAddress: post.user.emailAddress,
          instagram: post.user.instagram,
          phoneNumber: post.user.phoneNumber,
          whatsapp: post.user.whatsapp,
        }
      }

    })


    res.status(200).json({ posts:filterpost, total: numberOfPost })

  } catch (err) {
    next(err)
  }
};

exports.singlePost = async (req, res, next) => {
  try {
    const post = await Blog.findOne({ _id: req.params.id, status: "public" }).populate("user");

    if (!post) {
      
      const error = new Error("پستی با این شناسه یافت نشد");
      error.statusCode = 404
      throw error
    }
    const filterpost = {
        status: post.status,
        category: post.category,
        _id: post._id,
        title: post.title,
        body: post.body,
        thumbnail: post.thumbnail,
        user: {
          profileImg: post.user.profileImg,
          bio: post.user.bio,
          _id: post.user._id,
          fullname: post.user.fullname,
          emailAddress: post.user.emailAddress,
          instagram: post.user.instagram,
          phoneNumber: post.user.phoneNumber,
          whatsapp: post.user.whatsapp,
        }
      }

    console.log(filterpost);
    res.status(200).json({ post:filterpost })

  } catch (err) {
    next(err)
  }
};



exports.contactHandler = async (req, res, next) => {
  const { email, fullname, subject, text, numCaptcha } = req.body;
  if (CAPTCHA_PNG_NUM != numCaptcha) {
    res.status(400).json({ message: "کد امنیتی به درستی وارد نشده است" })
  }
  try {
    await Blog.contactValidator(req.body);
    resevEmail(
      subject,
      `
      <div style='width:90%; margin:10px auto; text-align:center;'>
        <h2>سلام میلاد یه پیام داری از طرف <b>${fullname}</b></h2>
        <p>متن پیام : <br> ${text}</p>
        <a href='mailto:${email}'>${email}</a>
      </div>
    `
    );
    res.status(200).json({ message: "پیام شما با موفقیت ارسال شد" })
  } catch (err) {
    const errors = [];
    if (err.name === 'ValidationError') {
      err.inner.forEach((e) => {
        errors.push({ message: e.message, fildname: e.path });
      });
      err.statusCode = 422;
      err.message = "خطای اعتبار سنجی"
      err.data = errors
    }
    next(err)
  }
};

exports.numberCaptcha = (req, res) => {
  CAPTCHA_PNG_NUM = parseInt(Math.random() * 9000 + 1000)
  const p = new captchapng(80, 30, CAPTCHA_PNG_NUM)
  p.color(0, 0, 0, 0)
  p.color(255, 255, 255, 255)

  const image = p.getBase64();
  const imgBase64 = Buffer.from(image, 'base64')
  res.send(imgBase64)
}
