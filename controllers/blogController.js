const captchapng = require('captchapng'); 

const Blog = require("../models/blog");
const { resevEmail } = require("../utils/mailer");

let CAPTCHA_PNG_NUM;

exports.getIndex = async (req, res,next) => {
  try {
    const numberOfPost = await Blog.find({ status: "public" }).countDocuments();
    const posts = await Blog.find({ status: "public" })
      .populate("user")
      .sort({ createAt: "desc" })
    if (!posts) {
      const error = new Error("هیچ پستی وجود ندارد در پایگاه داده")
      error.statusCode=404
      throw error
    }
      res.status(200).json({posts,total:numberOfPost})
    
  } catch (err) {
    next(err)
  }
};

exports.singlePost = async (req, res,next) => {
  try {
    const post = await Blog.findById(req.params.id).populate("user");
    if (!post) {
      const error = new Error("پستی با این شناسه یافت نشد");
      error.statusCode=404
      throw error
    }
    res.status(200).json({post})
    
  } catch (err) {
    next(err)
  }
};



exports.contactHandler = async (req, res,next) => {
  const { email, fullname, subject, text  } = req.body;
  try {
    await Blog.contactValidator(req.body);
    resevEmail(
      subject,
      `
      <div style='width:90%; margin:10px auto; text-align:center;'>
        <h2>سلام میلاد یه پیام داری از طرف <b>${fullname}</b></h2>
        <p>متن پیام : <br> ${text}</p>
        <a href='mail.${email}'>${email}</a>
      </div>
    `
    );
    res.status(200).json({message:"پیام شما با موفقیت ارسال شد"})
  } catch (err) {
    const errors = [];
    if(err.name === 'ValidationError'){
      err.inner.forEach((e) => {
        errors.push({message: e.message,fildname:e.path});
      });
      err.statusCode = 422;
      err.message="خطای اعتبار سنجی"
      err.data = errors
    }
    next(err)
  }
};

exports.numberCaptcha = (req,res)=>{
  CAPTCHA_PNG_NUM = parseInt(Math.random()*9000 + 1000)
  const p = new captchapng(80,30,CAPTCHA_PNG_NUM)
  p.color(0,0,0,0)
  p.color(255,255,255,255)

  const image = p.getBase64();
  const imgBase64 = Buffer.from(image,'base64')
  res.send(imgBase64)
}
