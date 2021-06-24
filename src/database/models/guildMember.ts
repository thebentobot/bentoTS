import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';
import type { user, userId } from './user';

export interface guildMemberAttributes {
  guildMemberID?: number;
  userID: number;
  guildID: number;
  xp: number;
  level: number;
}

export type guildMemberPk = "guildMemberID";
export type guildMemberId = guildMember[guildMemberPk];
export type guildMemberCreationAttributes = Optional<guildMemberAttributes, guildMemberPk>;

export class guildMember extends Model<guildMemberAttributes, guildMemberCreationAttributes> implements guildMemberAttributes {
  guildMemberID?: number;
  userID!: number;
  guildID!: number;
  xp!: number;
  level!: number;

  // guildMember belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;
  // guildMember belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof guildMember {
    guildMember.init({
    guildMemberID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    userID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'user',
        key: 'userID'
      }
    },
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'guild',
        key: 'guildID'
      }
    },
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'guildMember',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "guildmember_guildmemberid_uindex",
        unique: true,
        fields: [
          { name: "guildMemberID" },
        ]
      },
      {
        name: "guildmember_pk",
        unique: true,
        fields: [
          { name: "guildMemberID" },
        ]
      },
    ]
  });
  return guildMember;
  }
}
