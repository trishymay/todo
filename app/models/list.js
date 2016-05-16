var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ListSchema = new Schema({
  title: String,
  username: String,
  order: {}
});

module.exports = mongoose.model('List', ListSchema);