const path = require('path');

const express = require('express');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

const {errorHandler} = require('./middlewares/errorHandler');
const { setHeaders } = require('./middlewares/headers');
const connectDB = require('./config/db');

// LOAD CONFIG
dotEnv.config({path:"./config/config.env"})


const app = express()

// body parser
app.use(express.urlencoded({extended:false}))
app.use(express.json())


// set headers
app.use(setHeaders)

// file upload middleware
app.use(fileUpload())

// static
app.use(express.static(path.join(__dirname,'public')))

// database connection 
connectDB()

// router
app.use(require('./router/blog'))
app.use('/users', require('./router/users'))
app.use('/dashboard', require('./router/dashboard'))

// error handler 
app.use(errorHandler)

const PORT = process.env.PORT || 4000

app.listen(PORT,()=>console.log(`Server is running ${process.env.NODE_ENV} mode on port ${PORT}`))