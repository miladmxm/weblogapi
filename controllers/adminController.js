const fs = require("fs");

const appRoot = require("app-root-path");
const sharp = require("sharp");

const Blog = require("../models/blog");
const User = require("../models/user");
const { fullDate } = require("../utils/fullDate");

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
        (err) => {
          if (err) {
            const error = new Error("مشکلی در حذف تصویر اصلی به وجود آمده");
            error.statusCode = 400;
            throw error;
          }
        }
      );
      await post.remove();
      res.status(200).json({ message: `پست ${post.title} با موفقیت حذف شد` });
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
    if (image && image.mimetype == "image/jpeg" || image.mimetype == "image/png" && image.size < 4000000) {
      const fileName = `${fullDate()}_${image.name}`;
      await sharp(image.data)
        .jpeg({
          quality: 60,
        })
        .toFile(`./public/uploads/image/${user.email}/${fileName}`);
      res
        .status(200)
        .json({
          message: `http://localhost:4000/uploads/image/${user.email}/${fileName}`,
        });
    } else {
      const error = new Error("جهت آپلود یک عکس با حجم کمتر از 4 مگابایت انتخاب کنید");
      error.statusCode = 400;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};
