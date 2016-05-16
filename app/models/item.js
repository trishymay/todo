var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
  text: String,
  username: String,
  listId: String
});

module.exports = mongoose.model('Item', ItemSchema);