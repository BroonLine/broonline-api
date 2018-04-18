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
  // TODO: Remove need for position (lookup from Google Maps API if place not already added)
  const latitude = parseFloat(options.position.latitude);
  const longitude = parseFloat(options.position.longitude);

  let place = await Place.findById(placeId);
  let status = 200;
  if (!place) {
    place = new Place({
      _id: placeId,
      position: {
        latitude,
        longitude
      }
    });
    status = 201;
  }

  await place.saveAnswer(options.value);

  return withData({}, {
    place: includeLinks(place.toJSON(), { latitude, longitude })
  }, status);
}

async function assignGoogleDetails(placeId, place) {
  const details = await google.maps.places.findById(placeId);
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

      return includeLinks(place.toJSON(), place.position, relations);
    })
  });
}

async function findById(placeId, options = {}) {
  const place = await Place.findById(placeId);
  // TODO: If not found, attempt to lookup from Google Maps and build faux result from it
  if (!place) {
    return null;
  }

  const data = {
    place: includeLinks(place.toJSON(), place.position)
  };
  if (options.expand) {
    await assignGoogleDetails(placeId, data.place);
  }

  return withData({}, data);
}

function includeLinks(place, position, relations = {}) {
  const { latitude, longitude } = position;
  const { previous, next } = relations;
  const links = [
    {
      href: `/places/${encodeURIComponent(place.id)}{?expand}`,
      rel: 'self'
    },
    {
      href: `/places/${encodeURIComponent(place.id)}/answer?` +
      `position=${encodeURIComponent([ latitude, longitude ].join(','))}&value={value}`,
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
