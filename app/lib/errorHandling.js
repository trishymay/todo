var error = {};

error[400] = 'Required information missing';
error[401] = 'Invalid Username or Password';
error[403] = 'User not signed in';
error[404] = 'Error - not found';
error[409] = 'This username already exists';
error[500] = 'Error - request can not be processed';


error.message = function (err, res) {
  return res.status(err).json({msg: error[err]});
}

module.exports = error;
