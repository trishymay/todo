var express = require('express');
var app = express();
var User = require('../models/user');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var superSecret = config.secret;


var userAuth = {};

userAuth.makeToken = function (user, seconds) {
  return jwt.sign({
    email: user.email,
    username: user.username,
    issue_date: Date.now()
  }, superSecret, {
    expiresIn: seconds
  });
}

userAuth.checkToken = function (req, res, next) {
  var token = req.body.token || req.query.token || req.headers['token'];
  if (token) {
    jwt.verify(token, superSecret, function(err, decoded) {
      if (err && err.expiredAt) {
        var expired = jwt.decode(token);
        User.findOne({ 'username': expired.username})
        .select('email username password last_pw_change')
        .exec(function(err, user) {
          if (err) return res.status(449).json(err);
          if (!user) return res.status(449).json({msg: 'User not found'});
          if (req.body.password) {
            var validPassword = user.comparePassword(req.body.password);
            if (!validPassword) return res.status(449).json('Invalid password');
            req.decoded = expired;
            res.append('token', userAuth.makeToken(user));
            return next();
          }
          if (expired.issue_date >= user.last_pw_change) {
            req.decoded = expired;
            res.append('token', userAuth.makeToken(user));
            return next();
          }
          // Route for tokens created before a password was changed
          return res.status(449).json({msg: 'error - not signed in'});
        });
      } else if (err) {
        return res.status(449).json({msg: 'Failed to authenticate token'});
      } else {
        req.decoded = decoded;
        return next();
      }
    });
  } else {
    return res.status(449).json({msg: 'No token provided'});
  }
}

module.exports = userAuth;