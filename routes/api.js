'use strict';
const mongoose = require('mongoose');
const Thread = require('../models/thread');

module.exports = function (app) {
  // ✅ THREAD ROUTES
  app.route('/api/threads/:board')
    // CREATE THREAD
    .post(async (req, res) => {
      try {
        const board = req.params.board;
        const { text, delete_password } = req.body;

        const thread = new Thread({
          board,
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        });

        const savedThread = await thread.save();
        return res.json(savedThread); // for tests to read _id
      } catch (err) {
        console.error('Error creating thread:', err);
        res.status(500).json({ error: 'Server error creating thread' });
      }
    })

    // GET THREADS
    .get(async (req, res) => {
      const board = req.params.board;
      try {
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .select('-reported -delete_password')
          .lean();

        threads.forEach(thread => {
          thread.replies = thread.replies
            .sort((a, b) => b.created_on - a.created_on)
            .slice(0, 3)
            .map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
            }));
        });

        res.json(threads);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch threads' });
      }
    })

    // DELETE THREAD
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');
        if (thread.delete_password !== delete_password) {
          return res.send('incorrect password');
        }
        await Thread.findByIdAndDelete(thread_id);
        res.send('success');
      } catch (err) {
        res.status(500).send('Failed to delete thread');
      }
    })

    // REPORT THREAD
    .put(async (req, res) => {
      const { thread_id } = req.body;
      try {
        await Thread.findByIdAndUpdate(thread_id, { reported: true });
        res.send('reported');
      } catch (err) {
        res.status(500).send('Failed to report thread');
      }
    });

  // ✅ REPLY ROUTES
  app.route('/api/replies/:board')
    // CREATE REPLY
    .post(async (req, res) => {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;
      const reply = {
        _id: new mongoose.Types.ObjectId(),
        text,
        created_on: new Date(),
        delete_password,
        reported: false
      };
      try {
        await Thread.findByIdAndUpdate(
          thread_id,
          {
            $push: { replies: reply },
            $set: { bumped_on: new Date() }
          }
        );
        res.redirect(`/b/${board}/${thread_id}`);
      } catch (err) {
        res.status(500).send('Failed to post reply');
      }
    })

    // GET REPLIES
    .get(async (req, res) => {
      const { thread_id } = req.query;
      try {
        const thread = await Thread.findById(thread_id).select('-reported -delete_password').lean();
        if (!thread) return res.send('Thread not found');

        thread.replies = thread.replies.map(r => ({
          _id: r._id,
          text: r.text,
          created_on: r.created_on
        }));

        res.json(thread);
      } catch (err) {
        res.status(500).send('Failed to fetch replies');
      }
    })

    // DELETE REPLY
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');

        const reply = thread.replies.id(reply_id);
        if (!reply) return res.send('Reply not found');

        if (reply.delete_password !== delete_password) {
          return res.send('incorrect password');
        }

        reply.text = '[deleted]';
        await thread.save();

        res.send('success');
      } catch (err) {
        res.status(500).send('Failed to delete reply');
      }
    })

    // REPORT REPLY
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');

        const reply = thread.replies.id(reply_id);
        if (!reply) return res.send('Reply not found');

        reply.reported = true;
        await thread.save();

        res.send('reported');
      } catch (err) {
        res.status(500).send('Failed to report reply');
      }
    });
};
