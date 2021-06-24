import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';

export interface autoRoleAttributes {
  guildID: number;
  roleID: number;
}

export type autoRolePk = "guildID";
export type autoRoleId = autoRole[autoRolePk];
export type autoRoleCreationAttributes = Optional<autoRoleAttributes, autoRolePk>;

export class autoRole extends Model<autoRoleAttributes, autoRoleCreationAttributes> implements autoRoleAttributes {
  guildID!: number;
  roleID!: number;

  // autoRole belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof autoRole {
    autoRole.init({
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'guild',
        key: 'guildID'
      }
    },
    roleID: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'autoRole',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "autorole_pk",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "autorole_roleid_uindex",
        unique: true,
        fields: [
          { name: "roleID" },
        ]
      },
    ]
  });
  return autoRole;
  }
}
