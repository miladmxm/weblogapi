const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const transporterDetails = smtpTransport({
    host: 'mail.miladmxm.ir',
    port:'465',
    secure:true,
    auth:{
        user:'welcome@miladmxm.ir',
        pass:'WelcomePass'
    },
    tls:{
        rejectUnauthorized:false
    }
})

const transport = nodemailer.createTransport(transporterDetails);

exports.sendEmail=(to,subject,html)=>{

    const option = {
        from:'welcome@miladmxm.ir',
        to,
        subject,
        html
    }
    
    transport.sendMail(option,(err,info)=>{
        if(err) console.log('errrrrr'+err);
        console.log(info);
    })
}
exports.resevEmail=(subject,html)=>{

    const option = {
        from:'welcome@miladmxm.ir',
        to:'miladmxm12@gmail.com',
        subject,
        html
    }
    
    transport.sendMail(option,(err,info)=>{
        if(err) console.log('errrrrr'+err);
        console.log(info);
    })
}