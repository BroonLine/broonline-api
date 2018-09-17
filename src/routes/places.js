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

// TODO: Add sync endpoint to deal with multiple IDs with cron job (don't publish as link - perhaps use secret env var To lock down)

const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const { body: checkBody, query: checkQuery } = require('express-validator/check');
const { matchedData, sanitizeQuery } = require('express-validator/filter');

const { places } = require('../api/internal');
const { isBoolean, toBoolean } = require('../validators');
const validate = require('../middleware/validate');

const router = Router();

router.get('/', [
  checkQuery('bounds')
    .optional()
    .custom((value) => {
      validateCoordinates(value.ne, 'ne');
      validateCoordinates(value.sw, 'sw');

      return true;
    }),
  // TODO: Fix how error manifests when not valid boolean
  checkQuery('dominant')
    .optional()
    .custom((value) => isBoolean(value, { nullable: true }))
    .customSanitizer((value) => toBoolean(value, { nullable: true })),
  checkQuery('status')
    .optional()
    .isIn([ 'ACTIVE' ]),
  sanitizeQuery('bounds.*.*')
    .toFloat(),
  validate()
], asyncHandler(async(req, res) => {
  const options = matchedData(req);
  const result = await places.find(options);

  return res.status(200)
    .json(result);
}));

router.get('/:placeId', [
  checkQuery('expand')
    .optional()
    .isBoolean()
    .toBoolean(),
  validate()
], asyncHandler(async(req, res, next) => {
  const options = matchedData(req);
  const { placeId } = req.params;

  const result = await places.findById(placeId, options);
  if (!result) {
    return next();
  }

  return res.status(200)
    .json(result);
}));

router.post('/:placeId/answers', [
  checkBody('answer')
    .isBoolean()
    .toBoolean(),
  validate()
], asyncHandler(async(req, res, next) => {
  const { answer } = matchedData(req);
  const { placeId } = req.params;

  const result = await places.addAnswer(placeId, answer);
  if (!result) {
    return next();
  }

  return res.status(201)
    .json(result);
}));

router.links = [
  {
    href: '{?bounds,dominant,status}',
    rel: 'get-places'
  },
  {
    href: '/{placeId}{?expand}',
    rel: 'get-place'
  },
  {
    href: '/{placeId}/answers',
    rel: 'add-answer'
  }
];

function validateCoordinates(coordinates, name) {
  if (!Array.isArray(coordinates)) {
    throw new Error(`Invalid coordinate array for "${name}"`);
  }
  if (coordinates.length !== 2) {
    throw new Error(`Missing latitude and longitude coordinates for "${name}"`);
  }

  coordinates.forEach((coordinate, i) => {
    if (Number.isNaN(parseFloat(coordinate))) {
      const property = i === 0 ? 'latitude' : 'longitude';

      throw new Error(`Invalid ${property} coordinate for "${name}"`);
    }
  });
}

module.exports = router;
