/**
 * Copyright (C) 2018 Alasdair Mercer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// TODO: Add error handling (ensure API, non-API, async are all covered)
// TODO: Add CORS

'use strict';

if (process.env.NODE_ENV !== 'production') {
  /* eslint-disable global-require */
  require('dotenv').config();
  /* eslint-enable global-require */
}

const compression = require('compression');
const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const logger = require('./logger');
require('./database');

const port = process.env.PORT || 3001;
const server = express()
  .disable('x-powered-by')
  .use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
  .use(compression())
  .use(express.json())
  .use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', process.env.WEB_HOST);

    next();
  })
  .use('/', api)
  .listen(port, (err) => {
    if (err) {
      logger.error('Failed to start server', err);
    } else {
      logger.info('Server started on port %d', port);
    }
  });

module.exports = server;
