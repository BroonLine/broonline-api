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

const Place = require('../models/Place');

const router = Router();
router.get('/', [
  check('dominant')
    .optional()
    .isIn([ 'no', 'yes' ])
], asyncHandler(async(req, res) => {
  // TODO: Support ability to query for locations within specific region (coord boundaries) to optimize page load
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400)
      .json({ errors: errors.array() });
  }

  const params = matchedData(req);
  const places = await Place.find(params);

  return res.json({
    data: { places }
  });
}));

router.get('/:placeId', asyncHandler(async(req, res) => {
  const { placeId } = req.params;

  const place = await Place.findById(placeId);
  if (!place) {
    return res.status(404)
      .json({ errors: [ 'Not found!' ] });
  }

  return res.json({
    data: { place }
  });
}));

router.post('/:placeId/answer', [
  check('answer')
    .isIn([ 'no', 'yes' ]),
  check('position')
    .isLatLong()
], asyncHandler(async(req, res) => {
  const { answer, placeId, position } = req.params;
  const [ latitude, longitude ] = position.split(',');

  let place = await Place.findById(placeId);
  let status = 200;
  if (!place) {
    place = new Place({
      _id: placeId,
      position: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
    status = 201;
  }

  await place.saveAnswer(answer);

  res.status(status)
    .json({
      data: { place }
    });
}));

module.exports = router;
