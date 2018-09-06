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

const Cache = require('node-cache');
const { Router } = require('express');
const asyncHandler = require('express-async-handler');

const { stats } = require('../api/internal');
const { calculateMaxAge } = require('../utils/cache');
const { statsCacheTtl } = require('../config');

const cache = new Cache({ stdTTL: statsCacheTtl });
const router = Router();

router.get('/', asyncHandler(async(req, res) => {
  const cacheKey = 'stats';
  let result = cache.get(cacheKey);
  if (!result) {
    result = await stats.get();

    cache.set(cacheKey, result);
  }

  res.header('Cache-Control', `private, max-age=${calculateMaxAge(cache, cacheKey)}`);

  return res.status(200)
    .json(result);
}));

router.links = [
  {
    href: '',
    rel: 'get-stats'
  }
];

module.exports = router;
