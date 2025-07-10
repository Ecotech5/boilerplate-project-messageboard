'use strict';
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const apiRoutes = require('./routes/api.js');

const app = express();

// ✅ Connect to MongoDB using MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Helmet Security Headers (for FCC tests 2–4)
app.use(helmet());
app.use(helmet.frameguard({ action: 'sameorigin' })); // Test 2
app.use(helmet.dnsPrefetchControl({ allow: false })); // Test 3
app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // Test 4

// Optional: add CSP for general security (not required for tests)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  }
}));

// ✅ Other middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ✅ HTML routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/b/:board/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'board.html'));
});

app.get('/b/:board/:threadid', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'thread.html'));
});

// ✅ API routes
apiRoutes(app);

// ✅ 404 Handler
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Your app is listening on port ${PORT}`);
});

module.exports = app; // for testing
