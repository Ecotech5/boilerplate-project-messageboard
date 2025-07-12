// models/Thread.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  delete_password: String,
  reported: Boolean
}, { _id: true });

const threadSchema = new mongoose.Schema({
  board: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [replySchema]
});

module.exports = mongoose.model('Thread', threadSchema);
