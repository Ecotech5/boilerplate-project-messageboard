'use strict';
const Thread = require('../models/thread');

module.exports = function (app) {
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const thread = new Thread({
        board: req.params.board,
        text,
        delete_password
      });
      await thread.save();
      res.redirect(`/b/${req.params.board}/`);
    })

    .get(async (req, res) => {
      const threads = await Thread.find({ board: req.params.board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-reported -delete_password')
        .lean();

      threads.forEach(thread => {
        thread.replycount = thread.replies.length;
        thread.replies = thread.replies
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
          .map(r => ({
            _id: r._id,
            text: r.text,
            created_on: r.created_on
          }));
      });

      res.json(threads);
    })

    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');
      if (thread.delete_password !== delete_password) return res.send('incorrect password');
      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    })

    .put(async (req, res) => {
      const { thread_id } = req.body;
      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send('reported');
    });

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('thread not found');

      const newReply = {
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(newReply);
      thread.bumped_on = new Date();
      await thread.save();
      res.redirect(`/b/${req.params.board}/${thread_id}`);
    })

    .get(async (req, res) => {
      const thread = await Thread.findById(req.query.thread_id).select('-reported -delete_password').lean();
      if (!thread) return res.status(404).send('thread not found');

      thread.replies = thread.replies.map(r => ({
        _id: r._id,
        text: r.text,
        created_on: r.created_on
      }));

      res.json(thread);
    })

    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send('reply not found');
      if (reply.delete_password !== delete_password) return res.send('incorrect password');

      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    })

    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send('reply not found');

      reply.reported = true;
      await thread.save();
      res.send('reported');
    });
};
