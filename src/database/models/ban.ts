import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild.js';
import type { user, userId } from './user.js';

export interface banAttributes {
  banCase?: number;
  userID: bigint;
  guildID: bigint;
  date?: Date;
  note?: string;
  actor: bigint;
}

export type banPk = "banCase";
export type banId = ban[banPk];
export type banCreationAttributes = Optional<banAttributes, banPk>;

export class ban extends Model<banAttributes, banCreationAttributes> implements banAttributes {
  banCase?: number;
  userID!: bigint;
  guildID!: bigint;
  date?: Date;
  note?: string;
  actor!: bigint;

  // ban belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;
  // ban belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;
  // ban belongsTo user via actor
  actor_user!: user;
  getActor_user!: Sequelize.BelongsToGetAssociationMixin<user>;
  setActor_user!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createActor_user!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof ban {
    ban.init({
    banCase: {
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
    tableName: 'ban',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "ban_actor_uindex",
        unique: true,
        fields: [
          { name: "actor" },
        ]
      },
      {
        name: "ban_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "ban_mutecase_uindex",
        unique: true,
        fields: [
          { name: "banCase" },
        ]
      },
      {
        name: "ban_pk",
        unique: true,
        fields: [
          { name: "banCase" },
        ]
      },
      {
        name: "ban_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return ban;
  }
}
