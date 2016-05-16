var express = require('express');
var userRouter = express.Router();
var User = require('../models/user');
var Item = require('../models/item');
var List = require('../models/list');
var auth = require('../lib/authMiddle.js');
var makeToken = auth.makeToken;
var checkToken = auth.checkToken;
var errs = require('../lib/errorHandling.js').message;

userRouter.post('/createuser', function(req, res) {
  var user = new User();
  user.email = req.body.email;
  user.username = req.body.username;
  user.password = req.body.password;
  user.last_pw_change = Date.now();
  user.save(function(err, user) {
    if (err) {
      if (err.code === 11000) return errs(409, res);
      return errs(500, res);
    }
    res.status(200).json(user);
  });
});

userRouter.post('/signin', function(req, res) {
  User.findOne({ username: req.body.username}).select('email username password')
  .exec(function(err, user) {
    if (err) return errs(500, res);
    if (!user) return errs(401, res);
    var validPassword = user.comparePassword(req.body.password);
    if (!validPassword) return errs(401, res);
    res.status(200).json({msg: 'User successfully authenticated', token: makeToken(user, 7200)});
  });
});

userRouter.use(checkToken);

userRouter.route('/account')
  .get(function(req, res) {
    User.findOne({ 'username': req.decoded.username }, function (err, user) {
      if (err) return errs(500, res);
      if (!user) return errs(404, res);
      res.status(200).json(user);
    });
  })

  .put(function(req, res) {
    User.findOne({ 'username': req.decoded.username }).select('email username password')
    .exec(function(err, user) {
      if (err) return errs(500, res);
      if (!user) return errs(404, res);
      if (!req.body.newPassword && !req.body.newEmail)
        return errs(400, res);
      var validPassword = user.comparePassword(req.body.password);
      if (!validPassword) return errs(401, res);
      if (req.body.newEmail) user.email = req.body.newEmail;
      if (req.body.newPassword) {
        user.password = req.body.newPassword;
        res.append('token', makeToken(user, 7200));
      }
      user.save(function (err, data) {
        if (err) return errs(500, res);
        res.status(200).json(data);
      });
    });
  })

  .delete(function(req, res) {
    User.findOneAndRemove({ 'username': req.decoded.username })
    .select('email username password').exec(function(err, user) {
      if (err) return errs(500, res);
      if (!user) return errs(404, res);
      var validPassword = user.comparePassword(req.body.password);
      if (!validPassword) return errs(401, res);
      List.remove({ 'username': req.decoded.username }, function(err) {
        if (err) return errs(500, res);
        Item.remove({ 'username': req.decoded.username }, function(err) {
          if (err) return errs(500, res);
          res.removeHeader('token');
          res.status(200).json({msg: 'User Deleted'});
        });
      });
    });
  });

module.exports = userRouter;