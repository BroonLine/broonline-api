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

const mongoose = require('mongoose');

const { mongodbUri } = require('./config');
const { getLogger } = require('./logger');

const dbLogger = getLogger('db');
const logger = getLogger();

mongoose.set('debug', (collectionName, methodName, ...args) => {
  dbLogger.log('verbose', 'db.%s.%s(%o...)', collectionName, methodName, args);
});
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect(mongodbUri);

const { connection } = mongoose;
connection.on('error', (err) => logger.log('error', 'Failed to connect to database', { error: err }));
connection.once('open', () => logger.log('info', 'Connected to database'));

module.exports = connection;
