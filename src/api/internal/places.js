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

const { google } = require('../external');
const Place = require('../../models/Place');
const { builder } = require('../../utils/hateoas');
const { calculateDominant } = require('../../utils/answers');

async function addAnswer(placeId, answer) {
  const place = await findById(placeId);
  if (!place) {
    return null;
  }

  await place.addAnswer(answer);

  return builder()
    .body(place.toJSON())
    .links(getPlaceLinks(place))
    .build();
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

function castDetails(details, options) {
  if (!details) {
    return null;
  }

  const { location } = details.geometry;

  return new Place({
    _id: details.place_id,
    answers: options.expand ? [] : null,
    position: {
      type: 'Point',
      coordinates: [
        location.lat,
        location.lng
      ]
    },
    created: {
      date: null
    },
    modified: {
      date: null
    }
  });
}

async function find(options = {}) {
  let query = Place.find();
  if (options.bounds) {
    query = query.where('position')
      .within(convertBoundsToPolygon(options.bounds));
  }
  if (typeof options.dominant !== 'undefined') {
    query = query.where('answerSummary.dominant')
      .equals(options.dominant);
  }

  const places = await query;

  return builder()
    .body({
      content: places.map((place, index) => {
        return builder()
          .body(place.toJSON())
          .links(getPlaceLinks(place, {
            previous: places[index - 1],
            next: places[index + 1]
          }))
          .build();
      })
    })
    .links(getPlacesLinks())
    .build();
}

async function findById(placeId, options = {}) {
  let place = await findByIdOrAlias(placeId, options);
  const details = !place || options.expand ? await google.maps.places.findById(placeId) : null;

  if (!place) {
    place = castDetails(details, options);

    if (!place) {
      return null;
    }
  }

  return builder()
    .body(place.toJSON())
    .links(getPlaceLinks(place))
    .when(options.expand && details, (b) => {
      b.body({
        address: details.formatted_address,
        name: details.name,
        phoneNumber: details.formatted_phone_number,
        rating: details.rating
      });
      b.links([
        {
          href: details.url,
          rel: 'open-place'
        }
      ]);
    })
    .build();
}

async function findByIdOrAlias(placeId, options = {}) {
  let place = await Place.findById(placeId, options.expand ? '+answers' : '');
  if (!place) {
    place = await Place.findOne({ aliases: placeId }, options.expand ? '+answers' : '');
  }

  return place;
}

function getPlaceLinks(place, relations = {}) {
  const { previous, next } = relations;
  const links = [
    {
      href: `/places/${encodeURIComponent(place.id)}{?expand}`,
      rel: 'self'
    },
    {
      href: `/places/${encodeURIComponent(place.id)}/answers`,
      rel: 'add-answer'
    }
  ];

  if (previous) {
    links.push({
      href: `/places/${encodeURIComponent(previous.id)}{?expand}`,
      rel: 'previous'
    });
  }
  if (next) {
    links.push({
      href: `/places/${encodeURIComponent(next.id)}{?expand}`,
      rel: 'next'
    });
  }

  return links;
}

function getPlacesLinks() {
  return [
    {
      href: '/places{?bounds,dominant}',
      rel: 'self'
    }
  ];
}

async function getStats() {
  const answers =  {
    false: 0,
    true: 0
  };
  let total = 0;

  await Place.find().cursor().eachAsync((place) => {
    answers.false += place.answerSummary.false;
    answers.true += place.answerSummary.true;

    total++;
  });

  answers.dominant = calculateDominant(answers.false, answers.true);
  answers.total = answers.false + answers.true;

  return {
    answers,
    total
  };
}

module.exports = {
  addAnswer,
  find,
  findById,
  getStats
};
