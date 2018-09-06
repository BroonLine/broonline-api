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

const apiHost = envVar('API_HOST');
const concurrency = envVar('WEB_CONCURRENCY', parseIntNullable, 1);
const googleMapsApiKey = envVar('GOOGLE_MAPS_API_KEY');
const loggingLevel = envVar('LOGGING_LEVEL', null, 'info');
const mongodbUri = envVar('MONGODB_URI');
const nodeEnv = envVar('NODE_ENV', null, 'development');
const port = envVar('PORT', parseIntNullable, 5000);
const statsCacheTtl = envVar('STATS_CACHE_TTL', parseIntNullable, 180);
const webHost = envVar('WEB_HOST');

function envVar(name, parser, defaultValue) {
  const rawValue = process.env[name];
  if (rawValue == null) {
    if (defaultValue == null) {
      throw new Error(`Missing required configuration: "${name}`);
    }

    return defaultValue;
  }

  const parsedValue = parser ? parser(rawValue) : rawValue;
  if (parsedValue == null) {
    if (defaultValue == null) {
      throw new Error(`Malformed configuration: "${name}" -> "${rawValue}"`);
    }

    return defaultValue;
  }

  return parsedValue;
}

function isProduction() {
  return nodeEnv === 'production';
}

function parseIntNullable(value) {
  const parsedValue = parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return parsedValue;
}

module.exports = {
  apiHost,
  concurrency,
  googleMapsApiKey,
  isProduction,
  loggingLevel,
  mongodbUri,
  port,
  statsCacheTtl,
  webHost
};
