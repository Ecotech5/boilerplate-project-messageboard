const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  delete_password: String,
  reported: Boolean
});

const ThreadSchema = new mongoose.Schema({
  board: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [ReplySchema]
});

module.exports = mongoose.model('Thread', ThreadSchema);
