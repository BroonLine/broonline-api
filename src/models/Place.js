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

// TODO: Improve (migrate) data structure (see below comment)
/*
 * Goal:
 * answers -> make new schema for answers and change to array of that schema, creating virtuals for summaries
 * dates.created -> move to "createdAt"
 * dates.modified -> move to "updatedAt"
 * dominant -> move to virtual (see "answers" notes)
 * position -> move to "location" and change to GeoJSON Point
 */

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  _id: { type: String },
  answers: {
    no: { type: Number, min: 0, default: 0 },
    yes: { type: Number, min: 0, default: 0 }
  },
  dates: {
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now }
  },
  dominant: { type: String, enum: [ null, 'no', 'yes' ] },
  position: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, {
  toObject: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;

      return ret;
    }
  }
});

schema.method('saveAnswer', function(answer, callback) {
  this.answers[answer] = this.answers[answer] + 1;

  return this.save(callback);
});

schema.static('findLastCreated', function(callback) {
  return this.findOne()
    .sort('-dates.created')
    .exec(callback);
});

schema.static('findLastModified', function(callback) {
  return this.findOne()
    .sort('-dates.modified')
    .exec(callback);
});

schema.virtual('answers.total').get(function() {
  return this.answers.no + this.answers.yes;
});

schema.pre('save', function(next) {
  this.dates.modified = Date.now();

  if (this.answers.no === this.answers.yes) {
    this.dominant = null;
  } else if (this.answers.no > this.answers.yes) {
    this.dominant = 'no';
  } else {
    this.dominant = 'yes';
  }

  next();
});

const Place = mongoose.model('Place', schema);

module.exports = Place;
