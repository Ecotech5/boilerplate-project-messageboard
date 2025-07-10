'use strict';

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes/api.js');

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


// ✅ Apply Helmet headers for FreeCodeCamp tests
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    baseUri: ["'self'"],
    blockAllMixedContent: [],
    fontSrc: ["'self'", "https:", "data:"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    imgSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    scriptSrcAttr: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
app.use(helmet.frameguard({ action: 'sameorigin' })); // ✅ Test 2
app.use(helmet.dnsPrefetchControl({ allow: false })); // ✅ Test 3
app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // ✅ Test 4


// ✅ Other middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(process.cwd() + '/public'));

// ✅ HTML routes
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

app.route('/b/:board/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/board.html');
  });

app.route('/b/:board/:threadid')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

// ✅ API routes
apiRoutes(app);

// ✅ 404 handler
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});

module.exports = app; // for testing
