'use strict';

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// ✅ Import routes
const apiRoutes = require('./routes/api.js');

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ✅ Apply Helmet with custom CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      scriptSrcAttr: ["'none'"]
    }
  }
}));

// ✅ Additional Helmet headers for FCC test 3 & 4
app.use(helmet.dnsPrefetchControl({ allow: false }));       // Test 3
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));  // Test 4
app.use(helmet.frameguard({ action: 'sameorigin' }));        // Test 2 fallback if CSP fails

// ✅ Middleware
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
