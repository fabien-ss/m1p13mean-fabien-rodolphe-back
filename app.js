require('dotenv').config();
const mongoose = require('mongoose');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var testRouter = require('./routes/test');
var authRouter = require('./routes/auth');
var roleRouter = require('./routes/role');
var boutiqueRouter = require('./routes/boutique');
var produitRouter = require('./routes/produit');

var app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.error("Erreur MongoDB:", err));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/test', testRouter);
app.use('/auth', authRouter);
app.use('/role', roleRouter);
app.use('/boutique', boutiqueRouter);
app.use('/produit', produitRouter);

module.exports = app;
