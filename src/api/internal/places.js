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
const { withData, withLinks } = require('../../utils/hateoas');

async function addAnswer(placeId, options = {}) {
  const place = await findById(placeId);
  if (!place) {
    return null;
  }

  await place.saveAnswer(options.value);

  return withData({}, {
    place: includeLinks(place.toJSON())
  });
}

function castDetails(details) {
  if (!details) {
    return null;
  }

  const { location } = details.geometry;

  return new Place({
    _id: details.place_id,
    dates: {
      created: null,
      modified: null
    },
    dominant: null,
    position: {
      latitude: location.lat,
      longitude: location.lng
    }
  });
}

function expandWithDetails(place, details) {
  if (!details) {
    return place;
  }

  Object.assign(place, {
    address: details.formatted_address,
    name: details.name,
    phoneNumber: details.formatted_phone_number,
    rating: details.rating
  });

  withLinks(place, [
    {
      href: details.url,
      rel: 'map'
    }
  ]);

  return place;
}

async function find(options = {}) {
  // TODO: Support ability to query for locations within specific region (coord boundaries) to optimize page load
  const places = await Place.find(options);

  return withData({}, {
    places: places.map((place, index) => {
      const relations = {
        previous: places[index - 1],
        next: places[index + 1]
      };

      return includeLinks(place.toJSON(), relations);
    })
  });
}

async function findById(placeId, options = {}) {
  let place = await Place.findById(placeId);
  const details = !place || options.expand ? await google.maps.places.findById(placeId) : null;

  if (!place) {
    place = castDetails(details);

    if (!place) {
      return null;
    }
  }

  const data = {
    place: includeLinks(place.toJSON())
  };

  if (options.expand) {
    expandWithDetails(data.place, details);
  }

  return withData({}, data);
}

function includeLinks(place, relations = {}) {
  const { previous, next } = relations;
  const links = [
    {
      href: `/places/${encodeURIComponent(place.id)}{?expand}`,
      rel: 'self'
    },
    {
      href: `/places/${encodeURIComponent(place.id)}/answer?value={value}`,
      rel: 'answer'
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

  return withLinks(place, links);
}

module.exports = {
  addAnswer,
  find,
  findById
};
