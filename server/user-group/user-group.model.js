'use strict';

const find = require('lodash/find');
const { Model } = require('sequelize');
const { restoreOrCreate } = require('../common/database/restore');

class UserGroup extends Model {
  static fields({ DATE, INTEGER, STRING }) {
    return {
      parentId: {
        type: INTEGER,
        field: 'parent_id'
      },
      name: {
        type: STRING
      },
      createdAt: {
        type: DATE,
        field: 'created_at'
      },
      updatedAt: {
        type: DATE,
        field: 'updated_at'
      },
      deletedAt: {
        type: DATE,
        field: 'deleted_at'
      }
    };
  }

  static associate({ EnrollmentOffering, User, UserGroupMember, OfferingUserGroup }) {
    this.belongsToMany(User, {
      as: 'members',
      through: UserGroupMember,
      foreignKey: { name: 'userGroupId', field: 'user_group_id' }
    });
    this.belongsToMany(EnrollmentOffering, {
      through: OfferingUserGroup,
      foreignKey: { name: 'enrollmentOfferingId', field: 'enrollment_offering_id' }
    });
    this.belongsTo(this, {
      as: 'parent',
      foreignKey: { name: 'parentId', field: 'parent_id' }
    });
    this.hasMany(this, {
      as: 'children',
      foreignKey: { name: 'parentId', field: 'parent_id' }
    });
  }

  static options() {
    return {
      modelName: 'userGroup',
      tableName: 'user_group',
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    };
  }

  static hooks() {
    return {
      afterDestroy(userGroup) {
        const where = { parentId: userGroup.id };
        return this.destroy({ where });
      },
      afterUpdate(userGroup) {
        const isRestored = userGroup.changed('deletedAt') && !userGroup.deletedAt;
        if (!isRestored) return;
        const where = { parentId: userGroup.id };
        return this.update({ deletedAt: null }, { where, paranoid: false });
      }
    };
  }

  static async restoreOrCreate(userGroup, options) {
    return restoreOrCreate(this, userGroup, options);
  }

  static async hasAncestorInstructor(user, currentItem, items = [currentItem]) {
    const parent = await this.getParent(currentItem);
    if (!parent) return;
    items.push(parent);
    const { userGroupMember } = find(parent.members, { id: user.id }) || {};
    const isUserInstructor = userGroupMember && userGroupMember.isInstructor();
    return isUserInstructor || this.hasAncestorInstructor(user, parent, items);
  }

  static getParent({ parentId }) {
    const attributes = ['id', 'parentId'];
    const User = this.sequelize.model('User');
    const include = [{ model: User, as: 'members', attributes: ['id'] }];
    return this.findByPk(parentId, { attributes, include });
  }
}

module.exports = UserGroup;
