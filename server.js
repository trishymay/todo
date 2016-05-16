var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var userRouter = require('./app/routes/userRoutes');
var toDoRouter = require('./app/routes/toDoRoutes');
var adminRouter = require('./app/routes/adminRoutes');
var config = require('./config');

mongoose.connect(process.env.MONGO || config.database);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Home Page');
});

app.use('/admin', adminRouter);
app.use('/user', userRouter);
app.use('/todo', toDoRouter);

app.listen(config.port);
// eslint-disable-next-line no-console
console.log('Listening on port ' + config.port);

module.exports = app;
