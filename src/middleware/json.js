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

// TODO: Externalize and/or contribute to express

function json(options = {}) {
  const {
    skip = () => false,
    spaces = 2
  } = options;

  return (req, res, next) => {
    if (!skip(req, res)) {
      res.json = (obj) => {
        const { app } = req;
        const escape = app.get('json escape');
        const replacer = app.get('json replacer');
        const body = stringify(obj, replacer, spaces, escape);

        if (!res.get('Content-Type')) {
          res.set('Content-Type', 'application/json');
        }

        return res.send(body);
      };
    }

    next();
  };
}

function stringify(value, replacer, spaces, escape) {
  let str = replacer || spaces ? JSON.stringify(value, replacer, spaces) : JSON.stringify(value);
  if (escape) {
    str = str.replace(/[<>&]/g, (c) => {
      switch (c.charCodeAt(0)) {
      case 0x3c:
        return '\\u003c';
      case 0x3e:
        return '\\u003e';
      case 0x26:
        return '\\u0026';
      default:
        return c;
      }
    });
  }

  return str;
}

module.exports = json;
