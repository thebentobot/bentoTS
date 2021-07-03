import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild.js';
import type { user, userId } from './user.js';

export interface kickAttributes {
  kickCase?: number;
  userID: bigint;
  guildID: bigint;
  date?: Date;
  note?: string;
  actor: bigint;
}

export type kickPk = "kickCase";
export type kickId = kick[kickPk];
export type kickCreationAttributes = Optional<kickAttributes, kickPk>;

export class kick extends Model<kickAttributes, kickCreationAttributes> implements kickAttributes {
  kickCase?: number;
  userID!: bigint;
  guildID!: bigint;
  date?: Date;
  note?: string;
  actor!: bigint;

  // kick belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;
  // kick belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;
  // kick belongsTo user via actor
  actor_user!: user;
  getActor_user!: Sequelize.BelongsToGetAssociationMixin<user>;
  setActor_user!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createActor_user!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof kick {
    kick.init({
    kickCase: {
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true
    },
    actor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'user',
        key: 'userID'
      }
    }
  }, {
    sequelize,
    tableName: 'kick',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "kick_actor_uindex",
        unique: true,
        fields: [
          { name: "actor" },
        ]
      },
      {
        name: "kick_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "kick_mutecase_uindex",
        unique: true,
        fields: [
          { name: "kickCase" },
        ]
      },
      {
        name: "kick_pk",
        unique: true,
        fields: [
          { name: "kickCase" },
        ]
      },
      {
        name: "kick_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return kick;
  }
}
