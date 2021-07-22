import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';

export interface kickAttributes {
  kickCase?: number;
  userID: bigint;
  guildID: bigint;
  date?: Date;
  note?: string;
  actor: bigint;
  reason?: string;
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
  reason?: string;

  // kick belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

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
      allowNull: false
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
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'kick',
    schema: 'public',
    timestamps: false,
    indexes: [
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
    ]
  });
  return kick;
  }
}
