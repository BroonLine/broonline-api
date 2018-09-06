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
  const { place } = await findByIdInternal(placeId);
  if (!place) {
    return null;
  }

  await place.addAnswer(answer);

  return builder()
    .body(place.toJSON())
    .links(getPlaceLinks(place))
    .build();
}

function castDetails(placeId, details, options = {}) {
  if (!details) {
    return null;
  }

  const { location } = details.geometry;
  const place = new Place({
    _id: details.place_id,
    answers: options.expand ? [] : null,
    position: {
      type: 'Point',
      coordinates: [
        location.lat,
        location.lng
      ]
    },
    status: 'ACTIVE',
    created: {
      date: null
    },
    modified: {
      date: null
    }
  });

  if (place.id !== placeId) {
    place.aliases.push(placeId);
  }

  return place;
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

function createFindByIdQuery(placeId, options = {}) {
  const projection = options.expand ? '+answers' : '';

  return Place.findOne({
    $or: [
      { _id: placeId },
      { aliases: placeId }
    ]
  }, projection);
}

function createFindQuery(options = {}) {
  let query = Place.find();
  if (options.bounds) {
    query = query.where('position').within(convertBoundsToPolygon(options.bounds));
  }
  if (typeof options.dominant !== 'undefined') {
    query = query.where('answerSummary.dominant').equals(options.dominant);
  }
  if (options.status) {
    query = query.where('status').equals(options.status);
  } else {
    query = query.where('status').ne('DELETED');
  }

  return query;
}

async function find(options = {}) {
  const places = await createFindQuery(options);

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
  const { details, place } = await findByIdInternal(placeId, options);
  if (!place) {
    return null;
  }

  return builder()
    .body(place.toJSON())
    .links(getPlaceLinks(place))
    .when(options.expand && details, (b) => {
      b.body({
        address: details.formatted_address || null,
        name: details.name || null,
        phoneNumber: details.formatted_phone_number || null,
        rating: details.rating || null
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

async function findByIdInternal(placeId, options = {}) {
  let place = await createFindByIdQuery(placeId, options);
  const details = !place || options.expand ? await google.maps.places.findById(placeId) : null;

  if (!place) {
    place = castDetails(placeId, details, options);
  }

  if (!place || place.status === 'DELETED') {
    return {};
  }

  return {
    details,
    place
  };
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
      href: '/places{?bounds,dominant,status}',
      rel: 'self'
    }
  ];
}

async function getStats(options = {}) {
  const answers =  {
    false: 0,
    true: 0
  };
  let total = 0;

  await createFindQuery({ status: options.status })
    .cursor()
    .eachAsync((place) => {
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
