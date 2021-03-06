const fs = require("fs");

const appRoot = require("app-root-path");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");
const Blog = require("../models/blog");
const User = require("../models/user");
const { fullDate } = require("../utils/fullDate");
const { sendEmail } = require("../utils/mailer");

exports.getPost = async (req, res, next) => {
  const id = req.params.id;
  try {
    const isAdmin = await User.findOne({ _id: id, isAdmin: true });
    let numberOfPost, posts

    if (isAdmin) {
      numberOfPost = await Blog.find().countDocuments();
      posts = await Blog.find().sort({ createdAt: "desc" }).populate("user");

    } else {
      const user = await User.findOne({ _id: id });
      if (user) {
        numberOfPost = await Blog.find({ user: id }).countDocuments();
        posts = await Blog.find({ user: id }).sort({ createdAt: "desc" });

      } else {
        const error = new Error('کاربری یافت نشد')
        error.statusCode = 401;
        throw error
      }
    }
    if (!posts) {
      const error = new Error("هیچ پستی وجود ندارد در پایگاه داده");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ posts, total: numberOfPost });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const isAdmin = await User.findOne({ _id: req.userId, isAdmin: true });
    if (isAdmin) {
      const allUser = await User.find().sort({ createdAt: "desc" })
      if (allUser) {
        res.status(200).json({ allUser });
      }
    } else {
      const error = new Error("شما مجوز استفاده از این بخش را ندارید");
      error.statusCode = 428;
      throw error;
    }
  } catch (err) {
    next(err);
  }
}

exports.createPost = async (req, res, next) => {
  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${fullDate()}_${thumbnail.name}.webp`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;
  try {
    const user = await User.findOne({ _id: req.userId });
    if (user) {
      req.body = { ...req.body, thumbnail: thumbnail };

      await Blog.postValidation(req.body);

      await sharp(thumbnail.data)
        .webp({
          quality: 30,
        })
        .toFile(uploadPath)
        .catch((err) => console.log(err));

      await Blog.create({ ...req.body, user: req.userId, thumbnail: fileName });
      res.status(201).json({ message: "پست با موفقیت ساخته شد" });
    } else {
      const error = new Error('کاربری یافت نشد')
      error.statusCode = 401;
      throw error
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

exports.editPost = async (req, res, next) => {
  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${fullDate()}_${thumbnail.name}.webp`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;
  const isAdmin = await User.findOne({ _id: req.userId, isAdmin: true });

  const post = await Blog.findOne({ _id: req.params.id });
  try {
    const user = await User.findOne({ _id: req.userId });
    if (user) {
      if (thumbnail.name) await Blog.postValidation({ ...req.body, thumbnail });
      else {
        await Blog.postValidation({
          ...req.body,
          thumbnail: { name: "vs", size: 0, mimetype: "image/jpeg" },
        });
      }

      if (post && post.user.toString() === req.userId || post && req.userId === isAdmin._id.toString()) {
        if (thumbnail.name) {
          fs.unlink(
            `${appRoot}/public/uploads/thumbnails/${post.thumbnail}`,
            async (err) => {
              if (err) {
                const error = new Error(
                  "مشکلی در جایگزین کردن تصویر اصلی به وجود آمد"
                );
                error.statusCode = 400;
                throw error;
              } else {
                await sharp(thumbnail.data)
                  .webp({ quality: 30 })
                  .toFile(uploadPath)
                  .catch((err) => {
                    if (err) {
                      const error = new Error(
                        "مشکلی در ذخیره تصویر اصلی جدید به وجود آمده"
                      );
                      error.statusCode = 400;
                      throw error;
                    }
                  });
              }
            }
          );
        }

        const { title, body, status, category } = req.body;
        post.title = title;
        post.body = body;
        post.status = status;
        post.category = category
        post.thumbnail = thumbnail.name ? fileName : post.thumbnail;
        await post.save();
        res.status(200).json({ message: "تغییرات با موفقیت انجام شد" });
      } else {
        const error = new Error("پست مورد نظر شما پیدا نشد");
        error.statusCode = 404;
        throw error;
      }
    } else {
      const error = new Error('کاربری یافت نشد')
      error.statusCode = 401;
      throw error
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

exports.deletePost = async (req, res, next) => {
  try {
    const isAdmin = await User.findOne({ _id: req.userId, isAdmin: true });
    const post = await Blog.findOne({ _id: req.params.id });
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      const error = new Error('کاربری یافت نشد')
      error.statusCode = 401;
      throw error
    }
    if (post && post.user.toString() == req.userId || post && isAdmin && req.userId === isAdmin._id.toString()) {
      fs.unlink(
        `${appRoot}/public/uploads/thumbnails/${post.thumbnail}`,
        async (err) => {
          if (err) {
            const error = new Error("مشکلی در حذف تصویر اصلی به وجود آمده");
            error.statusCode = 400;
            throw error;
          } else {
            await post.remove();
            res
              .status(200)
              .json({ message: `پست ${post.title} با موفقیت حذف شد` });
          }
        }
      );
    } else {
      const error = new Error("پست مورد نظر شما پیدا نشد");
      error.statusCode = 404;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      const error = new Error('کاربری یافت نشد')
      error.statusCode = 401;
      throw error
    }
    const readUserUnicFolder = fs.existsSync(
      `${appRoot}/public/uploads/image/${user.email}`
    );
    if (!readUserUnicFolder) {
      fs.mkdirSync(`${appRoot}/public/uploads/image/${user.email}`);
    }
    const image = req.files.image;
    if (
      (image && image.mimetype == "image/jpeg") ||
      (image.mimetype == "image/png" && image.size < 4000000)
    ) {
      const fileName = `${fullDate()}_${image.name}.webp`;
      await sharp(image.data)
        .webp({
          quality: 30,
        })
        .toFile(`./public/uploads/image/${user.email}/${fileName}`);
      res.status(200).json({
        message: `http://localhost:4000/uploads/image/${user.email}/${fileName}`,
      });
    } else {
      const error = new Error(
        "جهت آپلود یک عکس با حجم کمتر از 4 مگابایت انتخاب کنید"
      );
      error.statusCode = 400;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

exports.getAllImgUser = async (req, res) => {
  const user = await User.findOne({ _id: req.userId });

  if (!user || user == null) {
    return res.status(401).json({ message: "کاربری یافت نشد" });
  }
  const email = req.params.email;
  const allFile = [];
  fs.readdir(`${appRoot}/public/uploads/image/${email}/`, (err, files) => {
    if (err) {
      res.status(400).json({
        message: "مشکلی در گرفتن تصاویر وجود دارد یا ایمیل شما اشتباه است",
      });
    }
    if (typeof files != "undefined") {
      files.forEach((file) => {
        allFile.push(file);
      });
      res.status(200).json(allFile);
    } else {
      res.status(404).json({ message: "تصویری موجود نیست" });
    }
  });
};

exports.editProfile = async (req, res, next) => {
  const { password, newPassword, newRePassword, bio, skill, social } = req.body;
  const id = req.params.id
  const socialmedia = social.split(',')
  const profileImg = req.files ? req.files.profile : false;
  try {
    const userEditor = await User.findOne({ _id: req.userId });
    const user = await User.findOne({ _id: id });
    if (!user || !userEditor.isAdmin) {
      if (!user || user._id.toString() !== req.userId) {
        const error = new Error("کاربری با این شناسه وجود ندارد");
        error.statusCode = 400;
        throw error;
      }
    }
    if (!password) {
      const error = new Error("کلمه عبور صحیح نیست");
      error.statusCode = 422;
      throw error;
    }
    let isEcual;
    if (userEditor.isAdmin) {
      isEcual = await bcrypt.compare(password, userEditor.password);
    } else {
      isEcual = await bcrypt.compare(password, user.password);
    }
    if (!isEcual) {
      const error = new Error("کلمه عبور صحیح نیست");
      error.statusCode = 422;
      throw error;
    } else if (!profileImg && !newPassword && !bio && !skill && social.length <= 3) {
      res.status(400).json({
        message: "برای تنظیمات پروفایل خود حداقل یک مورد را تغییر دهید",
      });
    }

    if (
      (profileImg && profileImg.mimetype == "image/jpeg") ||
      (profileImg.mimetype == "image/png" && profileImg.size < 4000000)
    ) {
      const fileName = `userprofile_${profileImg.name}`;
      await sharp(profileImg.data)
        .resize(200)
        .toFile(`./public/uploads/image/${user.email}/${fileName}`)
        .catch((err) => {
          if (err) {
            const error = new Error("مشکلی در ذخیره تصویر پروفایل بوجود آمده");
            error.statusCode = 400;
            throw error;
          }
        });
      user.profileImg = profileImg
        ? `${user.email}/${fileName}`
        : user.profileImg;
    }
    if (newPassword) {
      if (newPassword.length > 3) {
        if (newPassword === newRePassword) {
          if (newPassword !== password) {
            user.password = newPassword;
          }
        } else {
          const error = new Error("کلمه عبور با تکرار آن همخوانی ندارد");
          error.statusCode = 422;
          throw error;
        }
      } else {
        const error = new Error("کلمه عبور نباید کمتر از 4 کاراکتر باشد");
        error.statusCode = 422;
        throw error;
      }
    }

    if (bio) {
      if (bio.length > 5) {
        user.bio = bio;
      } else {
        const error = new Error("بیوگرافی شما نباید کمتر از 5 کاراکتر باشد");
        error.statusCode = 400;
        throw error;
      }
    }
    if (skill) {
      user.skill = skill;
    }


    if (socialmedia[0]) {
      user.emailAddress = socialmedia[0]
    }
    if (socialmedia[1]) {
      user.whatsapp = socialmedia[1]
    }
    if (socialmedia[2]) {
      user.instagram = socialmedia[2]
    }
    if (socialmedia[3]) {
      user.phoneNumber = socialmedia[3]
    }
    await user.save();

    const token = jwt.sign(
      { user: { userId: user._id.toString(), fullname: user.fullname, email: user.email, profileImg: user.profileImg, bio: user.bio, skill: user.skill, instagram: user.instagram, whatsapp: user.whatsapp, emailAddress: user.emailAddress, phoneNumber: user.phoneNumber, dadashami: user.isAdmin ? "dada" : "nadada" } },
      process.env.JWT_SECRET, {
      expiresIn: "2h"
    }
    );
    res.status(200).json({ token, userId: user._id.toString() });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.deleteUserReq = async (req, res, next) => {
  const { email, password, grecaptcharesponse } = req.body
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
      if (!email || !password) {
        const error = new Error("ایمیل یا کلمه عبور وارد نشده است")
        error.statusCode = 422;
        throw error
      }
      const user = await User.findOne({ email })
      if (user) {
        if (user.isAdmin) {
          const error = new Error('شما نمیتوانید خودتون رو پاک کنید');
          error.statusCode = 422;
          throw Error
        }
        const isEcual = await bcrypt.compare(password, user.password);
        if (isEcual) {

          const posts = await Blog.find({ user: user._id.toString() })
          posts.map(f => {
            fs.unlinkSync(`${appRoot}/public/uploads/thumbnails/${f.thumbnail}`);
          })

          await Blog.deleteMany({ user: user._id.toString() }, err => {
            if (err) {
              const error = new Error('در حذف پست ها مشکلی رخ داد');
              error.statusCode = 500;
              throw Error
            }
          })
          fs.rmdir(`${appRoot}/public/uploads/image/${user.email}`, { recursive: true }, (err) => {
            if (err) {
              const error = new Error('در حذف تصاویر مشکلی رخ داد');
              error.statusCode = 500;
              throw Error
            }
          }
          )
          await User.deleteOne({ email }, err => {
            if (err) {
              const error = new Error('مشکلی در حذف کاربر رخ داد');
              error.statusCode = 500;
              throw Error
            } else {
              res.status(200).json({ message: 'کاربر با موفقیت حذف شد' })
            }
          })

        } else {
          const error = new Error("ایمیل یا کلمه عبور وارد نشده است")
          error.statusCode = 422;
          throw error
        }
      } else {
        const error = new Error("کاربر پیدا نشد")
        error.statusCode = 404;
        throw error
      }
    } else {
      const error = new Error('کپچا به درستی تایید نشده است')
      error.statusCode = 400
      throw error
    }
  } catch (err) {
    next(err)
  }
}
exports.deleteUserByAdmin = async (req, res, next) => {
  const moveData = req.body.moveData
  const id = req.params.id;
  try {
    const isAdmin = await User.findOne({ _id: req.userId, isAdmin: true });
    if (isAdmin && req.userId === isAdmin._id.toString()) {
      const user = await User.findOne({ _id: id })
      const currentUser = await User.findOne({ _id: req.userId })
      if (user) {
        if (user._id == req.userId) {
          const error = new Error('شما نمیتوانید خودتون رو پاک کنید');
          error.statusCode = 422
          throw error;
        }
        const posts = await Blog.find({ user: user._id.toString() })
       
        
        if (!moveData) {
          if (posts) {

            posts.map(f => {
              fs.unlinkSync(`${appRoot}/public/uploads/thumbnails/${f.thumbnail}`);
            })

            await Blog.deleteMany({ user: user._id.toString() }, err => {
              if (err) {
                const error = new Error('در حذف پست ها مشکلی رخ داد');
                error.statusCode = 500;
                throw Error
              }
            })
          }
          fs.rmdir(`${appRoot}/public/uploads/image/${user.email}`, { recursive: true }, (err) => {
            if (err) {
              const error = new Error('در حذف تصاویر مشکلی رخ داد');
              error.statusCode = 500;
              throw Error
            }
          }
          )
        } else {
          await Blog.updateMany({ user: user._id.toString() }, { user: currentUser._id }, function (err) {
            if (err) {
              console.log(err);
            }
          })

          fs.readdir(`${appRoot}/public/uploads/image/${user.email}/`, (err, files) => {
            if (err) {
             console.log(err);
            }
            if (typeof files != "undefined") {
              files.forEach((file) => {
                const currentPath = `${appRoot}/public/uploads/image/${user.email}/${file}`;
                const destinationPath = `${appRoot}/public/uploads/image/${currentUser.email}/${file}`

                fs.rename(currentPath, destinationPath, function (err) {
                  if (err) {
                    const error = new Error("مشکلی در انتقال تصاویر وجود دارد")
                    error.statusCode = 400;
                    throw error
                  }
                });
              });

            }
          });
        }

        await User.deleteOne({ email: user.email }, err => {
          if (err) {
            const error = new Error('مشکلی در حذف کاربر رخ داد');
            error.statusCode = 500;
            throw Error
          } else {
            res.status(200).json({ message: 'کاربر با موفقیت حذف شد' })
          }
        })

      } else {
        const error = new Error("کاربر پیدا نشد")
        error.statusCode = 404;
        throw error
      }

    } else {
      const error = new Error("شما مجوز دسترسی به این بخش را ندارید")
      error.statusCode = 422;
      throw error
    }

  } catch (err) {
    console.log('in errror'+err);
    next(err)
  }
}


exports.addUser = async (req, res, next) => {
  console.table(req.body)
  const profileImg = req.files ? req.files.profileImg : false
  const { isAdmin, fullname, password, bio, skill, email, emailAddress, whatsapp, instagram, phoneNumber } = req.body
  try {
    await User.userValidation(req.body);
    const isUser = await User.findOne({ email })
    if (isUser) {
      const error = new Error("کاربر با این ایمیل موجود است")
      error.statusCode = 422
      throw error
    }

    const userInfo = {
      fullname,
      email,
      password,
      bio,
      skill,
      emailAddress,
      whatsapp,
      instagram,
      phoneNumber,
      isAdmin
    }


    const readUserUnicFolder = fs.existsSync(
      `${appRoot}/public/uploads/image/${email}`
    );
    if (!readUserUnicFolder) {
      fs.mkdirSync(`${appRoot}/public/uploads/image/${email}`);
    }

    if (
      (profileImg && profileImg.mimetype == "image/jpeg") && profileImg.size < 4000000 ||
      (profileImg && profileImg.mimetype == "image/png" && profileImg.size < 4000000)
    ) {
      const fileName = `userprofile_${profileImg.name}`;
      await sharp(profileImg.data)
        .resize(200)
        .toFile(`./public/uploads/image/${email}/${fileName}`)
        .catch((err) => {
          if (err) {
            const error = new Error("مشکلی در ذخیره تصویر پروفایل بوجود آمده");
            error.statusCode = 400;
            throw error;
          }
        });

      userInfo.profileImg = `${email}/${fileName}`

    }
    await User.create(userInfo);
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
    res.status(201).json({ message: "ثبت نام با موفقیت انجام شد" });

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

}
