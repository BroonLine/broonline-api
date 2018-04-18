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

'use strict';

const compression = require('compression');
const express = require('express');
const morgan = require('morgan');

const { isProduction, port } = require('./config');
const logger = require('./logger');
const { cors, errorHandler, notFoundHandler } = require('./middleware');
const routes = require('./routes');
require('./database');

const server = express()
  .disable('x-powered-by')
  .use(morgan(isProduction() ? 'combined' : 'dev'))
  .use(compression())
  .use(express.json())
  .use(cors())
  .use('/', routes)
  .use(notFoundHandler())
  .use(errorHandler())
  .listen(port, (err) => {
    if (err) {
      logger.error('Failed to start server', err);
    } else {
      logger.info('Server started on port %d', port);
    }
  });

module.exports = server;
