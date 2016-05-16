var express = require('express');
var toDoRouter = express.Router();
var Item = require('../models/item');
var List = require('../models/list');
var auth = require('../lib/authMiddle.js');
var makeToken = auth.makeToken;
var checkToken = auth.checkToken;

// Make sure user is authorized before accessing any lists or items
toDoRouter.use(checkToken);

toDoRouter.route('/items/:listId')
  // Get all items for one specific list
  .get(function(req, res) {
    Item.find({'username': req.decoded.username, 'listId': req.params.listId }, function(err, items) {
      if (err) return res.send(err);
      if (!items.length) return res.send('No items found');
      res.json(items);
    });
  })

  // Create a new item on an existing todo list
  .post(function(req, res) {
    var item = new Item(req.body);
    item.username = req.decoded.username;
    item.listId = req.params.listId;
    item.save(function(err) {
      if (err) return res.send(err);
      res.send('Item Created');
    });
  })

  // Update the text of a specific list item
  .put(function(req, res) {
    Item.findOne({ 'username': req.decoded.username, '_id': req.body.id }, function(err, item) {
      if (err) return res.send(err);
      if (!item) return res.send('Item not found');
      if (!req.body.text)
        return res.send('Updated list item not supplied');
      if (req.body.text) item.text = req.body.text;
      item.save(function (err) {
        if (err) return res.send(err);
        res.send('Item Updated');
      });
    });
  })

  // Delete one item from the list
  .delete(function(req, res) {
    Item.findOneAndRemove({ 'username': req.decoded.username, '_id': req.body.id }, function(err, item) {
      if (err) return res.send(err);
      if (!item) return res.send('No item found');
      res.send('Item Deleted');
    });
  });

toDoRouter.route('/mylists')
  // Get all lists for logged in user
  .get(function(req, res) {
    List.find({'username': req.decoded.username}, function(err, lists) {
      if (err) return res.send(err);
      if (!lists.length) return res.send('No lists found');
      res.json(lists);
    });
  })

  // Create a new todo list
  .post(function(req, res) {
    var list = new List(req.body);
    list.username = req.decoded.username;
    list.save(function(err) {
      if (err) return res.send(err);
      res.send('List Created');
    });
  })

  // Update the title or order for a specific list
  .put(function(req, res) {
    List.findOne({ 'username': req.decoded.username, '_id': req.body.listId }, function (err, list) {
      if (err) return res.send(err);
      if (!list) return res.send('List not found');
      if (!req.body.title && !req.body.order)
        return res.send('No updated title or order supplied');
      if (req.body.title) list.title = req.body.title;
      if (req.body.order) list.order = req.body.order;
      list.save(function (err) {
        if (err) return res.send(err);
        res.send('List Updated');
      });
    });
  })

  // Remove one list and all list items from that list
  .delete(function(req, res) {
    List.findOneAndRemove({ 'username': req.decoded.username, '_id': req.body.listId }, function(err, list) {
      if (err) return res.send(err);
      if (!list) return res.send('No List Found');
      Item.remove({ 'listId': req.body.listId }, function(err) {
        if (err) return res.send(err);
        res.send('List Deleted');
      });
    });
  });

module.exports = toDoRouter;