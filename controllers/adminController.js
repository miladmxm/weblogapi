const fs = require("fs");

const appRoot = require("app-root-path");
const sharp = require("sharp");
const bcrypt = require("bcryptjs");

const Blog = require("../models/blog");
const User = require("../models/user");
const { fullDate } = require("../utils/fullDate");

exports.getPost = async (req, res, next) => {
  const id = req.params.id;
  try {
    const numberOfPost = await Blog.find({ user: id }).countDocuments();
    const posts = await Blog.find({ user: id }).sort({ createdAt: "desc" });
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

exports.createPost = async (req, res, next) => {
  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${fullDate()}_${thumbnail.name}`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;
  try {
    req.body = { ...req.body, thumbnail: thumbnail };

    await Blog.postValidation(req.body);

    await sharp(thumbnail.data)
      .jpeg({
        quality: 60,
      })
      .toFile(uploadPath)
      .catch((err) => console.log(err));

    await Blog.create({ ...req.body, user: req.userId, thumbnail: fileName });
    res.status(201).json({ message: "پست با موفقیت ساخته شد" });
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
  const fileName = `${fullDate()}_${thumbnail.name}`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;
  const post = await Blog.findOne({ _id: req.params.id });
  try {
    if (thumbnail.name) await Blog.postValidation({ ...req.body, thumbnail });
    else {
      await Blog.postValidation({
        ...req.body,
        thumbnail: { name: "vs", size: 0, mimetype: "image/jpeg" },
      });
    }

    if (post && post.user.toString() == req.userId) {
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
                .jpeg({ quality: 60 })
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

      const { title, body, status } = req.body;
      post.title = title;
      post.body = body;
      post.status = status;
      post.thumbnail = thumbnail.name ? fileName : post.thumbnail;
      await post.save();
      res.status(200).json({ message: "تغییرات با موفقیت انجام شد" });
    } else {
      const error = new Error("پست مورد نظر شما پیدا نشد");
      error.statusCode = 404;
      throw error;
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
    const post = await Blog.findOne({ _id: req.params.id });
    if (post && post.user.toString() == req.userId) {
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
      const fileName = `${fullDate()}_${image.name}`;
      await sharp(image.data)
        .jpeg({
          quality: 60,
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
  const { password, newPassword, newRePassword } = req.body;
  console.log(password, newPassword, newRePassword);
  const profileimg = req.files ? req.files.profile : false;
  console.log(profileimg);
  try {
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      const error = new Error("کاربری با این شناسه وجود ندارد");
      error.statusCode = 400;
      throw error;
    } else if (!password) {
      const error = new Error("کلمه عبور صحیح نیست");
      error.statusCode = 422;
      throw error;
    }
    const isEcual = await bcrypt.compare(password, user.password);
    if (!isEcual) {
      const error = new Error("کلمه عبور صحیح نیست");
      error.statusCode = 422;
      throw error;
    } else if (!profileimg && !newPassword) {
      res.status(400).json({
        message: "برای تنظیمات پروفایل خود حداقل یک مورد را تغییر دهید",
      });
    }

    if (
      (profileimg && profileimg.mimetype == "image/jpeg") ||
      (profileimg.mimetype == "image/png" && profileimg.size < 4000000)
    ) {
      const fileName = `userprofile_${profileimg.name}`;
      await sharp(profileimg.data)
        .resize(200)
        .toFile(`./public/uploads/image/${user.email}/${fileName}`)
        .catch((err) => {
          if (err) {
            const error = new Error("مشکلی در ذخیره تصویر پروفایل بوجود آمده");
            error.statusCode = 400;
            throw error;
          }
        });
      user.profileImg = profileimg
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
    await user.save();
    res.status(200).json({ message: "تغییرات با موفقیت ذخیره شد", data: user });
  } catch (err) {
    next(err);
  }
};
