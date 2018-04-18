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

const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const { check, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const { places } = require('../api/internal');
const { withErrors, withResponse } = require('../utils/hateoas');

const router = Router();
router.get('/', [
  check('dominant')
    .optional()
    .isIn([ 'no', 'yes' ])
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return withResponse(withErrors({}, errors.array(), 422), res);
  }

  const options = matchedData(req);
  const result = await places.find(options);

  return withResponse(result, res);
}));

router.get('/:placeId', [
  check('expand')
    .optional()
    .isBoolean()
    .toBoolean()
], asyncHandler(async(req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return withResponse(withErrors({}, errors.array(), 422), res);
  }

  const options = matchedData(req);
  const { placeId } = req.params;

  const result = await places.findById(placeId, options);
  // TODO: If not found, attempt to lookup from Google Maps and build faux result from it
  if (!result) {
    return next();
  }

  return withResponse(result, res);
}));

router.post('/:placeId/answer', [
  check('answer')
    .isIn([ 'no', 'yes' ]),
  check('position')
    .isLatLong()
], asyncHandler(async(req, res, next) => {
  // TODO: Remove need for position (lookup from Google Maps API if place not already added)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return withResponse(withErrors({}, errors.array(), 422), res);
  }

  const { answer, position } = matchedData(req);
  const { placeId } = req.params;

  const result = await places.addAnswer(placeId, {
    answer,
    position: position.split(/,\s*/)
  });
  if (!result) {
    return next();
  }

  return withResponse(result, res);
}));

module.exports = router;
