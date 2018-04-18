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

const { withBody, withLinks, withResponse } = require('../utils/hateoas');

const links = [
  {
    href: '/',
    rel: 'self'
  }
];
const router = Router();
router.get('/', (req, res) => {
  const result = {};
  withBody(result);
  withLinks(result, links);

  withResponse(result, res);
});

function loadRoute(name) {
  const path = `/${name}`;
  /* eslint-disable global-require */
  const route = require(`.${path}`);
  /* eslint-enable global-require */

  router.use(path, route);

  for (const link of route.links) {
    links.push({
      href: `${path}${link.href}`,
      rel: link.rel
    });
  }
}

function loadRoutes(names) {
  names.forEach(loadRoute);
}

loadRoutes([
  'places'
]);

module.exports = router;
