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

const { apiHost } = require('../config');

function withBody(result, body, status = 200) {
  return Object.assign(result, { status }, body);
}

function withData(result, data, status = 200) {
  return withBody(result, { data }, status);
}

function withErrors(result, errors, status = 500) {
  if (!errors) {
    errors = [];
  }
  if (!Array.isArray(errors)) {
    errors = [ errors ];
  }
  errors = errors.map((error) => {
    return typeof error === 'string' ? { msg: error } : error;
  });

  return withBody(result, { errors }, status);
}

function withLinks(entity, links) {
  if (!links) {
    links = [];
  }

  if (!entity.links) {
    entity.links = [];
  }

  for (const link of links) {
    entity.links.push({
      href: link.href[0] === '/' ? `${apiHost}${link.href}` : link.href,
      rel: link.rel
    });
  }

  return entity;
}

function withResponse(result, response) {
  return response.status(result.status).json(result);
}

module.exports = {
  withBody,
  withData,
  withErrors,
  withLinks,
  withResponse
};
