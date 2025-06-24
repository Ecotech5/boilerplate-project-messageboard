const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadId;
let replyId;

describe('Functional Tests', function () {
  it('Create thread', done => {
    chai.request(server)
      .post('/api/threads/test')
      .send({ text: 'Test thread', delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  it('Get threads', done => {
    chai.request(server)
      .get('/api/threads/test')
      .end((err, res) => {
        assert.isArray(res.body);
        assert.property(res.body[0], '_id');
        threadId = res.body[0]._id;
        done();
      });
  });

  it('Report thread', done => {
    chai.request(server)
      .put('/api/threads/test')
      .send({ thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  it('Create reply', done => {
    chai.request(server)
      .post('/api/replies/test')
      .send({ text: 'Test reply', delete_password: 'pass', thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  it('Get thread with replies', done => {
    chai.request(server)
      .get('/api/replies/test')
      .query({ thread_id: threadId })
      .end((err, res) => {
        assert.property(res.body, 'replies');
        replyId = res.body.replies[0]._id;
        done();
      });
  });

  it('Report reply', done => {
    chai.request(server)
      .put('/api/replies/test')
      .send({ thread_id: threadId, reply_id: replyId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  it('Delete reply with wrong password', done => {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  it('Delete reply with correct password', done => {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });

  it('Delete thread with wrong password', done => {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: threadId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  it('Delete thread with correct password', done => {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: threadId, delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });
});
