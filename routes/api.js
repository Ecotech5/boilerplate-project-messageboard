'use strict';

const Thread = require('../models/thread');

module.exports = function (app) {
  // THREADS
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;
      try {
        const thread = new Thread({ board, text, delete_password });
        await thread.save();
        res.redirect(`/b/${board}/`);
      } catch {
        res.status(500).send('Error saving thread');
      }
    })

    .get(async (req, res) => {
      const { board } = req.params;
      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-reported -delete_password')
        .lean();

      threads.forEach(thread => {
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
      if (!thread || thread.delete_password !== delete_password)
        return res.send('incorrect password');
      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    })

    .put(async (req, res) => {
      const { thread_id } = req.body;
      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send('reported');
    });

  // REPLIES
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      thread.replies.push({ text, delete_password });
      thread.bumped_on = new Date();
      await thread.save();
      res.redirect(`/b/${req.params.board}/${thread_id}`);
    })

    .get(async (req, res) => {
      const thread = await Thread.findById(req.query.thread_id)
        .select('-reported -delete_password')
        .lean();

      if (!thread) return res.status(404).send('Not found');

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
      if (!thread) return res.send('Thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply || reply.delete_password !== delete_password)
        return res.send('incorrect password');

      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    })

    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('Thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send('Reply not found');

      reply.reported = true;
      await thread.save();
      res.send('reported');
    });
};
