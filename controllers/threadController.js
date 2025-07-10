const Thread = require('../models/thread');

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;
  const created_on = new Date();

  try {
    const newThread = new Thread({
      board,
      text,
      delete_password,
      created_on,
      bumped_on: created_on,
      reported: false,
      replies: []
    });

    await newThread.save();
    res.redirect(`/b/${board}/`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating thread');
  }
};

exports.getThreads = async (req, res) => {
  const { board } = req.params;

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
    console.error(err);
    res.status(500).send('Error getting threads');
  }
};

exports.reportThread = async (req, res) => {
  const { thread_id } = req.body;

  try {
    const thread = await Thread.findByIdAndUpdate(thread_id, { reported: true });
    if (!thread) return res.send('invalid id');
    res.send('reported');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reporting thread');
  }
};

exports.deleteThread = async (req, res) => {
  const { thread_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('invalid id');

    if (thread.delete_password !== delete_password) {
      return res.send('incorrect password');
    }

    await Thread.findByIdAndDelete(thread_id);
    res.send('success');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting thread');
  }
};