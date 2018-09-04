'use strict';

const { Course } = require('../common/database');
const config = require('../config');
const createStorage = require('../common/storage');
const forEach = require('lodash/forEach');
const keyBy = require('lodash/keyBy');
const pick = require('lodash/pick');

const Storage = createStorage(config.storage);
const inputAttributes = ['courseId', 'sourceId', 'programLevelId'];
const outputAttributes =
  ['id', 'sourceId', 'programLevelId', 'name', 'publishedAt'];
const processInput = input => pick(input, inputAttributes);

function list({ query: { programLevelId } }, res) {
  return Course.findAll({ where: { programLevelId },
    attributes: outputAttributes })
    .then(courses => {
      return Storage.getCatalog().then(data => {
        const coursesData = keyBy(data, value => value.id);
        forEach(courses, course => {
          const repoVersion = coursesData[course.sourceId].publishedAt;
          course.setDataValue('repoVersion', repoVersion);
        });
        return res.jsend.success(courses);
      });
    });
}

function getCatalog(req, res) {
  return Storage.getCatalog()
    .then(data => res.jsend.success(data));
}

function createOrUpdate({ body, params }, res) {
  const data = processInput(body);
  const courseId = params.id;
  const attributes =
    ['uid', 'schema', 'name', 'structure', 'description', 'publishedAt'];
  return Storage.getRepository(data.sourceId)
    .then(repository => {
      Object.assign(data, pick(repository, attributes));
      return Storage.syncRepository(data)
        .then(() => ({ repository, data }));
    })
    .then(({ repository, data }) => {
      return Course.findOrCreate({ where: { id: courseId }, defaults: data })
        .spread((course, created) => {
          if (!created) course.update(data);
          const courseData = pick(course, outputAttributes);
          courseData.repoVersion = repository.publishedAt;
          return res.jsend.success(courseData);
        });
    });
}

module.exports = {
  list,
  getCatalog,
  createOrUpdate
};
