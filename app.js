require('dotenv').config();
const mongoose = require('mongoose');

const cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var testRouter = require('./routes/test');
var authRouter = require('./routes/auth');
var roleRouter = require('./routes/role');
var shopRouter = require('./routes/shop');
var productRouter = require('./routes/product');
var categoryRouter = require('./routes/category')
var movementRouter = require('./routes/movement');
var princingRouter = require('./routes/pricing');
const orderRoutes = require('./routes/order');

var app = express();

const fs = require("fs");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connecté"))
.catch(err => console.error("Erreur MongoDB:", err));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'http://localhost:40477',
  'https://my-prod-site.com',
  'http://localhost:41957'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, // your Angular dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/test', testRouter);
app.use('/auth', authRouter);
app.use('/role', roleRouter);
app.use('/shop', shopRouter);
app.use('/product', productRouter);
app.use('/category', categoryRouter)
app.use("/uploads", express.static("uploads"));
app.use('/movement', movementRouter);
app.use('/pricing', princingRouter);
app.use('/orders', orderRoutes);

module.exports = app;
