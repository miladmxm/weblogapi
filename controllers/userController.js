const fs = require('fs');

const jwt = require("jsonwebtoken");
const appRoot = require("app-root-path");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");
const User = require("../models/user");
const { sendEmail } = require("../utils/mailer");

exports.loginHandler = async (req, res, next) => {

  const { email, password, reMember , grecaptcharesponse } = req.body;
  const secretKey = process.env.CAPTCHA_SECRET;
  const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${grecaptcharesponse}
    &remoteip=${req.connection.remoteAddress}`;

  try {
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      }
    });
    const json = await response.json();
    if (json.success) {

      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("ایمیل یا کلمه عبور صحیح نیست");
        error.statusCode = 422;
        throw error;
      }
      const isEcual = await bcrypt.compare(password, user.password);
      if (!isEcual) {
        const error = new Error("ایمیل یا کلمه عبور صحیح نیست");
        error.statusCode = 422;
        throw error;
      } else {
        const token = jwt.sign(
          { user: { userId: user._id.toString(), fullname: user.fullname, email: user.email, profileImg:user.profileImg} },
          process.env.JWT_SECRET,{
            expiresIn: +reMember?"72h":"2h",
          }
        );
        res.status(200).json({ token, userId: user._id.toString() });
      }
    } else {
      const error = new Error("کپچا به درستی تایید نشده است");
      error.statusCode = 422;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

exports.registerHandler = async (req, res, next) => {
  try {
    await User.userValidation(req.body);
    const { fullname, email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const error = new Error("ایمیل وارد شده قبلا ثبت نام کرده است");
      error.statusCode = 400;
      throw error;
    } else {
      await User.create({
        fullname,
        email,
        password,
      });
      sendEmail(
        email,
        "ثبت نام موفقیت آمیز بود",
        `
      <div style="width:95%; margin:auto; text-align:center;"
        <h1>سلام ${fullname}</h1>
        <h3>ثبت نام شما در وبسایت ما با موفقیت انجام شد امیدوارم از مطالب مفید شما لذت ببریم</h3>
        <a href="http://miladmxm.ir/">miladmxm</a>
        </div>
      `
      );
      const readUserUnicFolder = fs.existsSync(
        `${appRoot}/public/uploads/image/${email}`
      );
      if (!readUserUnicFolder) {
        fs.mkdirSync(`${appRoot}/public/uploads/image/${email}`);
      }
      res.status(201).json({ message: "ثبت نام با موفقیت انجام شد" });
    }
  } catch (err) {
    const errors = [];
    if (err.name === "ValidationError") {
      err.inner.forEach((e) => {
        errors.push({ message: e.message, fildname: e.path });
      });
      err.statusCode = 422;
      err.message = "خطای اعتبار سنجی";
      err.data = errors;
    }
    next(err);
  }
};

exports.handleForgetPass = async (req, res, next) => {

  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("ایمیل وارد شده صحیح نمیباشد");
      error.statusCode = 400;
      throw error;
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    sendEmail(
      user.email,
      "تغییر رمز عبور",
      `
      <div style="width:90%; margin:10px auto;">
      <h2 style='text-align:center'>سلام ${user.fullname}</h2>
      <p>شما برای تغییر رمز عبور خود اقدام کرده اید . <br> اگر قصد تغییر رمز را دارید از طریق لینک زیر اقدام کنید</p>
      <a href="http://localhost:3000/reset-password/${token}">تغییر رمز</a>
      </div>
      `
    );
    res.status(200).json({ message: "ایمیل برای تغییر کلمه عبور ارسال شد" });
  } catch (err) {
    next(err);
  }
};

exports.handleResetPass = async (req, res, next) => {
  const token = req.params.token;
  let decodedToken;
  const { password, repassword } = req.body;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      const error = new Error("شناسه به درستی وارد نشده است");
      error.statusCode = 404;
      throw error;
    } else if (!password || password.length < 4) {
      const error = new Error("کلمه عبور را به درستی وارد کنید");
      error.statusCode = 404;
      throw error;
    } else if (password !== repassword) {
      const error = new Error("کلمه عبور با تکرار آن همخوانی ندارد");
      error.statusCode = 400;
      throw error;
    }
    const user = await User.findById(decodedToken.userId);
    if (!user) {
      const error = new Error("کاربری با این شناسه یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    user.password = password;
    await user.save();
    res.status(200).json({ message: "کلمه عبور با موفقیت تغییر کرد" })
  } catch (err) {
    next(err)
  }
};
