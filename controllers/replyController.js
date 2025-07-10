// controllers/replyController.js
const Thread = require('../models/thread');
const { Types } = require('mongoose');

module.exports = {
  createReply: async (req, res) => {
    const { board } = req.params;
    const { text, delete_password, thread_id } = req.body;

    if (!text || !delete_password || !thread_id) {
      return res.status(400).send('Missing fields');
    }

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const reply = {
        _id: new Types.ObjectId(),
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(reply);
      thread.bumped_on = new Date();
      await thread.save();

      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },
  
  // (Other methods: getThread, reportReply, deleteReply can stay as previously defined.)
};