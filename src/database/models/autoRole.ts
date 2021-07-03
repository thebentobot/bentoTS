import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild.js';

export interface autoRoleAttributes {
  autoRoleID?: number;
  guildID: bigint;
  roleID: bigint;
}

export type autoRolePk = "autoRoleID";
export type autoRoleId = autoRole[autoRolePk];
export type autoRoleCreationAttributes = Optional<autoRoleAttributes, autoRolePk>;

export class autoRole extends Model<autoRoleAttributes, autoRoleCreationAttributes> implements autoRoleAttributes {
  autoRoleID?: number;
  guildID!: bigint;
  roleID!: bigint;

  // autoRole belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof autoRole {
    autoRole.init({
    autoRoleID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
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
        name: "autorole_autoroleid_uindex",
        unique: true,
        fields: [
          { name: "autoRoleID" },
        ]
      },
      {
        name: "autorole_pk",
        unique: true,
        fields: [
          { name: "autoRoleID" },
        ]
      },
    ]
  });
  return autoRole;
  }
}
