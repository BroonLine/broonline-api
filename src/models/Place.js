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

const answerSchema = new mongoose.Schema({
  answer: { type: Boolean, required: true },
  created: {
    date: { type: Date, default: Date.now }
  }
});

const pointSchema = new mongoose.Schema({
  type: { type: String, enum: [ 'Point' ], required: true },
  coordinates: { type: [ Number ], required: true }
});

const schema = new mongoose.Schema({
  _id: { type: String },
  aliases: { type: [ String ] },
  answerSummary: {
    false: { type: Number, min: 0, default: 0 },
    true: { type: Number, min: 0, default: 0 },
    dominant: { type: Boolean, default: null },
    total: { type: Number, min: 0, default: 0 }
  },
  answers: { type: [ answerSchema ] },
  // TODO: Is special indexing required to help findWithinBounds?
  position: { type: pointSchema, required: true },
  created: {
    date: { type: Date, default: Date.now }
  },
  modified: {
    date: { type: Date, default: Date.now }
  }
}, {
  toObject: {
    transform(doc, ret) {
      return {
        id: ret._id,
        aliases: ret.aliases,
        answerSummary: ret.answerSummary,
        answers: ret.answers,
        position: ret.position.coordinates,
        created: ret.created,
        modified: ret.modified
      };
    }
  }
});

schema.query.withinBounds = function(bounds) {
  return this.where({
    position: {
      $geoWithin: {
        $geometry: convertBoundsToPolygon(bounds)
      }
    }
  });
};

schema.method('addAnswer', function(answer, callback) {
  this.answers.push({
    answer,
    created: {
      date: Date.now()
    }
  });

  return this.save(callback);
});

schema.pre('save', function(next) {
  this.answerSummary = createAnswerSummary(this);
  this.modified.date = Date.now();

  next();
});

const Place = mongoose.model('Place', schema);

function createAnswerSummary(place) {
  const result = {
    false: 0,
    true: 0
  };

  place.answers.forEach((answer) => {
    const field = answer.answer ? 'true' : 'false';

    result[field]++;
  });

  result.dominant = getDominantAnswer(result.false, result.true);
  result.total = result.false + result.true;

  return result;
}

function convertBoundsToPolygon(bounds) {
  const [ x2, y1 ] = bounds.ne;
  const [ x1, y2 ] = bounds.sw;

  return {
    type: 'Polygon',
    coordinates: [[
      [ x1, y1 ],
      [ x1, y2 ],
      [ x2, y2 ],
      [ x2, y1 ],
      [ x1, y1 ]
    ]]
  };
}

function getDominantAnswer(falseCount, trueCount) {
  if (falseCount === trueCount) {
    return null;
  }

  return trueCount > falseCount;
}

module.exports = Place;
