var express = require('express');
var adminRouter = express.Router();
var User = require('../models/user');
var Item = require('../models/item');
var List = require('../models/list');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var superSecret = config.secret;

adminRouter.use(function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['token'];
  if (token) {
    jwt.verify(token, superSecret, function(err, decoded) {
      if (err || decoded.username !== 'trishymay') {
        return res.status(403).send({
          success: false,
          message: 'Failed to authenticate token.'
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token provided'
    });
  }
});

// Check that password has not changed since token was issued
adminRouter.use(function(req, res, next) {
  User.findOne({ 'username': req.decoded.username }, function (err, user) {
    if (err) return res.send(err);
    if (!user) return res.send('Username not found');
    if (req.decoded.issue_date < user.last_pw_change) return res.send('User not signed in');
    next();
  });
});

adminRouter.route('/users')
  .get(function(req, res) {
    User.find(function(err, users) {
      if (err) return res.send(err);
      if (!users.length) return res.send('No users found');
      res.json(users);
    });
  })

  .put(function(req, res) {
    User.findOne({ 'username': req.body.username }, function (err, user) {
      if (err) return res.send(err);
      if (!user) return res.send('Username not found');
      if (!req.body.password && !req.body.email)
        return res.send('No updated password or email supplied');
      if (req.body.password) user.password = req.body.password;
      if (req.body.email) user.email = req.body.email;
      user.save(function (err) {
        if (err) return res.send(err);
        res.send('User Updated');
      });
    });
  })

  .delete(function(req, res) {
    User.findOneAndRemove({ 'username': req.body.username }, function(err, user) {
      if (err) return res.send(err);
      if (!user) return res.send('No user found');
      List.remove({ 'username': req.body.username }, function(err) {
        if (err) return res.send(err);
        Item.remove({ 'username': req.body.username }, function(err) {
          if (err) return res.send(err);
          res.send('User Deleted');
        });
      });
    });
  });

adminRouter.route('/items')
  .get(function(req, res) {
    Item.find(function(err, items) {
      if (err) return res.send(err);
      if (!items.length) return res.send('No items found');
      res.json(items);
    });
  });

adminRouter.route('/lists')
  .get(function(req, res) {
    List.find(function(err, lists) {
      if (err) return res.send(err);
      if (!lists.length) return res.send('No lists found');
      res.json(lists);
    });
  });

module.exports = adminRouter;