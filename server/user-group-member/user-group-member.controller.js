'use strict';

const { CONFLICT, NO_CONTENT } = require('http-status');
const { Sequelize, UserGroupMember } = require('../common/database');
const { createError } = require('../common/errors');
const map = require('lodash/map');
const yn = require('yn');

const { Op } = Sequelize;

const createFilter = q => map(['email', 'firstName', 'lastName'],
  it => ({ [it]: { [Op.iLike]: `%${q}%` } }));

function list({ userGroup, query, options }, res) {
  const { filter, archived } = query;
  const where = { userGroupId: userGroup.id };
  const userWhere = filter ? { [Op.or]: createFilter(filter) } : {};
  const opts = { ...options, where, paranoid: !yn(archived) };
  return UserGroupMember.withUser({ where: userWhere }).findAndCountAll(opts)
    .then(({ rows, count }) => res.jsend.success({ items: rows, total: count }));
}

async function create({ userGroup, body }, res) {
  const { id, user } = body;
  const payload = { id, userGroupId: userGroup.id, userId: user.id };
  const [err, member] = await UserGroupMember.restoreOrCreate(payload);
  if (err) return createError(CONFLICT, 'Group member exists!');
  return res.jsend.success(member);
}

async function patch({ member, body }, res) {
  const { user, role } = body;
  const data = await member.update({ userId: user.id, role });
  res.jsend.success(data);
}

async function remove({ member }, res) {
  await member.destroy();
  return res.sendStatus(NO_CONTENT);
}

module.exports = {
  list,
  create,
  patch,
  remove
};
