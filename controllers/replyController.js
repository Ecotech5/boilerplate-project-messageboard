const Thread = require('../models/Thread');

exports.createReply = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password, thread_id } = req.body;
  const created_on = new Date();

  const reply = {
    text,
    delete_password,
    created_on,
    reported: false
  };

  const thread = await Thread.findById(thread_id);
  thread.replies.push(reply);
  thread.bumped_on = created_on;
  await thread.save();

  res.status(200).json({ success: true });

};

exports.getThread = async (req, res) => {
  const { thread_id } = req.query;

  const thread = await Thread.findById(thread_id).select('-delete_password -reported').lean();
  if (!thread) return res.send('thread not found');

  thread.replies = thread.replies.map(r => ({
    ...r,
    delete_password: undefined,
    reported: undefined
  }));

  res.json(thread);
};

exports.reportReply = async (req, res) => {
  const { thread_id, reply_id } = req.body;
  const thread = await Thread.findById(thread_id);
  const reply = thread.replies.id(reply_id);
  reply.reported = true;
  await thread.save();
  res.send('reported');
};

exports.deleteReply = async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;
  const thread = await Thread.findById(thread_id);
  const reply = thread.replies.id(reply_id);

  if (reply.delete_password !== delete_password) return res.send('incorrect password');

  reply.text = '[deleted]';
  await thread.save();
  res.send('success');
};
