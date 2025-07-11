'use strict';
const Thread = require('../models/thread');

module.exports = function (app) {
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;
      try {
        const thread = new Thread({
          board,
          text,
          delete_password
        });
        await thread.save();
        res.redirect(`/b/${board}/`);
      } catch (err) {
        res.status(500).send('Server error');
      }
    })

    .get(async (req, res) => {
      try {
        const threads = await Thread.find({ board: req.params.board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .select('-delete_password -reported')
          .lean();

        threads.forEach(t => {
          t.replycount = t.replies.length;
          t.replies = t.replies
            .sort((a, b) => b.created_on - a.created_on)
            .slice(0, 3)
            .map(r => ({
              _id: r._id,
              text: r.text,
              created_on: r.created_on
            }));
        });

        res.json(threads);
      } catch (err) {
        res.status(500).send('Server error');
      }
    })

    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if (!thread || thread.delete_password !== delete_password) {
          return res.send('incorrect password');
        }
        await Thread.findByIdAndDelete(thread_id);
        res.send('success');
      } catch {
        res.status(500).send('Server error');
      }
    })

    .put(async (req, res) => {
      try {
        await Thread.findByIdAndUpdate(req.body.thread_id, { reported: true });
        res.send('reported');
      } catch {
        res.status(500).send('Server error');
      }
    });

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { thread_id, text, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        thread.replies.push({
          text,
          delete_password,
          created_on: new Date(),
          reported: false
        });
        thread.bumped_on = new Date();
        await thread.save();
        res.redirect(`/b/${req.params.board}/${thread_id}`);
      } catch {
        res.status(500).send('Server error');
      }
    })

    .get(async (req, res) => {
      try {
        const thread = await Thread.findById(req.query.thread_id)
          .select('-delete_password -reported')
          .lean();
        if (!thread) return res.status(404).send('thread not found');
        thread.replies = thread.replies.map(r => ({
          _id: r._id,
          text: r.text,
          created_on: r.created_on
        }));
        res.json(thread);
      } catch {
        res.status(500).send('Server error');
      }
    })

    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        const reply = thread?.replies.id(reply_id);
        if (!reply || reply.delete_password !== delete_password) {
          return res.send('incorrect password');
        }
        reply.text = '[deleted]';
        await thread.save();
        res.send('success');
      } catch {
        res.status(500).send('Server error');
      }
    })

    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        const reply = thread?.replies.id(reply_id);
        if (!reply) return res.send('reply not found');
        reply.reported = true;
        await thread.save();
        res.send('reported');
      } catch {
        res.status(500).send('Server error');
      }
    });
};
