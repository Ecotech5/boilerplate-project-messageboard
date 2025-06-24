'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const apiRoutes = require('./routes/api.js');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.route('/').get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

apiRoutes(app);

app.use((req, res) => res.status(404).type('text').send('Not Found'));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app; // for testing
