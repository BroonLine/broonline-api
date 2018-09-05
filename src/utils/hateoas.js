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

const _body = Symbol('body');
const _errors = Symbol('errors');
const _links = Symbol('links');

class Builder {

  constructor() {
    this[_body] = {};
    this[_errors] = [];
    this[_links] = [];
  }

  body(body) {
    this[_body] = Object.assign({}, this[_body], body);

    return this;
  }

  errors(errors) {
    if (!errors) {
      errors = [];
    }
    if (!Array.isArray(errors)) {
      errors = [ errors ];
    }

    errors = errors.map((error) => {
      return typeof error === 'string' ? { msg: error } : error;
    });

    this[_errors] = this[_errors].concat(errors);

    return this;
  }

  links(links) {
    if (!links) {
      links = [];
    }
    if (!Array.isArray(links)) {
      links = [ links ];
    }

    links = links.map((link) => {
      return {
        href: !link.href || link.href[0] === '/' ? `${apiHost}${link.href}` : link.href,
        rel: link.rel
      };
    });

    this[_links] = this[_links].concat(links);

    return this;
  }

  when(expression, func) {
    if (expression) {
      func(this);
    }

    return this;
  }

  build() {
    const result = Object.assign({}, this[_body]);

    if (this[_errors].length) {
      result.errors = this[_errors].slice();
    }

    if (this[_links].length) {
      result.links = this[_links].slice();
    }

    return result;
  }

}

function builder() {
  return new Builder();
}

module.exports = {
  builder
};
