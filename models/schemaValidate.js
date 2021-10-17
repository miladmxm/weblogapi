const Yup = require('yup');

exports.userSchemaValidator = Yup.object().shape({
    fullname:Yup.string()
    .required('نام و نام خانوادگی الزامی میباشد')
    .min(3,'نام و نام خانوادگی نباید کمتر از 3 کاراکتر باشد')
    .max(255,'نام و نام خانوادگی نباید بیشتر از 255 کاراکتر باشد'),
    email: Yup.string()
    .email('ایمیل معتبر نمیباشد')
    .required('ایمیل الزامی میباشد'),
    password:Yup.string()
    .min(4,'کلمه عبور نباید کمتر از 4 کاراکتر باشد')
    .max(255,'کلمه عبور نباید بیشتر از 255 کاراکتر باشد')
    .required('کلمه عبور الزامی میباشد'),
    repassword:Yup.string()
    .required('تکرار کلمه عبور الزامی میباشد')
    .oneOf([Yup.ref('password'),null],'کلمه عبور با تکرار آن همخوانی ندارد')
})
exports.contactSchemaValidator = Yup.object().shape({
    fullname:Yup.string()
    .required('نام و نام خانوادگی الزامی میباشد')
    .min(3,'نام و نام خانوادگی نباید کمتر از 3 کاراکتر باشد')
    .max(255,'نام و نام خانوادگی نباید بیشتر از 255 کاراکتر باشد'),
    email: Yup.string()
    .email('ایمیل معتبر نمیباشد')
    .required('ایمیل الزامی میباشد'),
    subject:Yup.string()
    .required('موضوع پیام الزامی می باشد')
    .min(4,'موضوع نباید کمتر از 4 کاراکتر باشد')
    .max(255,'موضوع نباید بیشتر از 255 کاراکتر باشد'),
    text:Yup.string()
    .required('متن اصلی باید نوشته شود')
})

exports.addPostValidatorSchema = Yup.object().shape({
    title:Yup.string()
    .required('نوشتن عنوان الزامی می باشد')
    .min(4,'عنوان پست نباید کمتر از 4 کاراکتر باشد')
    .max(255,'عنوان پست نباید بیشتر از 255 کاراکتر باشد'),
    body:Yup.string()
    .required('متن اصلی اجباری است'),
    status:Yup.mixed().oneOf(['public','private'],'یکی از 2 وضعیت عمومی یا خصوصی را انتخاب کنید'),
    thumbnail:Yup.object().shape({
        name:Yup.string().required('تصویر بند انگشتی الزامی میباشد'),
        size:Yup.number().max(4000000,'تصویر بند انگشتی نباید بیشتر از 4 مگابایت باشد'),
        mimetype:Yup.mixed().oneOf(['image/jpeg','image/png'],'تنها فرمت های jpeg یا png پشتیبانی می شود')
    })
    
})