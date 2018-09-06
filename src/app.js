/*
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
const noSniff = require('dont-sniff-mimetype');
const express = require('express');

const { isProduction, port } = require('./config');
const { getLogger } = require('./logger');
const { cors, errorHandler, noCache, notFoundHandler, requestLogger } = require('./middleware');
const routes = require('./routes');
require('./database');

const logger = getLogger();

const app = express()
  .set('json spaces', isProduction() ? 0 : 2)
  .disable('x-powered-by')
  .use(requestLogger())
  .use(compression())
  .use(express.json())
  .use(noSniff())
  .use(noCache())
  .use(cors())
  .use('/', routes)
  .use(notFoundHandler())
  .use(errorHandler())
  .listen(port, (err) => {
    if (err) {
      logger.log('error', 'Failed to start server', { error: err });
    } else {
      logger.log('info', 'Server started on port: %d', port);
    }
  });

module.exports = app;
