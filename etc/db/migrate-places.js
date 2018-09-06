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

var cursor = db.places.find();

while (cursor.hasNext()) {
  var oldDoc = cursor.next();

  if ('modified' in oldDoc) {
    print('Skipping place: ' + oldDoc._id);
    continue;
  }

  var newDoc = {
    _id: oldDoc._id,
    aliases: [],
    answerSummary: createAnswerSummary(oldDoc),
    answers: createAnswers(oldDoc),
    position: createPosition(oldDoc),
    status: 'ACTIVE',
    created: createAudit(oldDoc, 'created'),
    modified: createAudit(oldDoc, 'modified'),
    __v: oldDoc.__v
  };

  print('Updating place: ' + oldDoc._id);
  printjson(newDoc);

  db.places.save(newDoc);
}

function createAnswerSummary(doc) {
  return {
    false: doc.answers.no,
    true: doc.answers.yes,
    dominant: getDominantAnswer(doc.answers.no, doc.answers.yes),
    total: doc.answers.no + doc.answers.yes
  };
}

function createAnswer(answer) {
  return {
    answer: answer,
    created: {
      date: null
    }
  };
}

function createAnswers(doc) {
  var result = [];
  var i;

  for (i = 0; i < doc.answers.no; i++) {
    result.push(createAnswer(false));
  }
  for (i = 0; i < doc.answers.yes; i++) {
    result.push(createAnswer(true));
  }

  return result;
}

function createAudit(doc, field) {
  return {
    date: doc.dates[field]
  };
}

function createPosition(doc) {
  return {
    type: 'Point',
    coordinates: [
      doc.position.latitude,
      doc.position.longitude
    ]
  };
}

function getDominantAnswer(falseCount, trueCount) {
  if (falseCount === trueCount) {
    return null;
  }

  return trueCount > falseCount;
}
