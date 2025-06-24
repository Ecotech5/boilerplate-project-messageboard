const Thread = require('../models/thread');

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;
  const created_on = new Date();

  const newThread = new Thread({
    board,
    text,
    delete_password,
    created_on,
    bumped_on: created_on,
    reported: false,
    replies: []
  });

  const saved = await newThread.save();
 res.status(200).json({ success: true });

};

exports.getThreads = async (req, res) => {
  const { board } = req.params;
  const threads = await Thread.find({ board })
    .sort({ bumped_on: -1 })
    .limit(10)
    .select('-reported -delete_password')
    .lean();

  threads.forEach(t => {
    t.replies = t.replies
      .slice(-3)
      .map(r => ({ ...r, delete_password: undefined, reported: undefined }));
  });

  res.json(threads);
};

exports.reportThread = async (req, res) => {
  const { thread_id } = req.body;
  await Thread.findByIdAndUpdate(thread_id, { reported: true });
  res.send('reported');
};

exports.deleteThread = async (req, res) => {
  const { thread_id, delete_password } = req.body;
  const thread = await Thread.findById(thread_id);
  if (!thread) return res.send('invalid id');
  if (thread.delete_password !== delete_password) return res.send('incorrect password');

  await Thread.findByIdAndDelete(thread_id);
  res.send('success');
};
