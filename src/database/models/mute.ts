import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';

export interface muteAttributes {
  muteCase?: number;
  userID: bigint;
  guildID: bigint;
  date?: Date;
  muteEnd?: Date;
  note?: string;
  actor: bigint;
  reason?: string;
  MuteStatus: boolean;
}

export type mutePk = "muteCase";
export type muteId = mute[mutePk];
export type muteCreationAttributes = Optional<muteAttributes, mutePk>;

export class mute extends Model<muteAttributes, muteCreationAttributes> implements muteAttributes {
  muteCase?: number;
  userID!: bigint;
  guildID!: bigint;
  date?: Date;
  muteEnd?: Date;
  note?: string;
  actor!: bigint;
  reason?: string;
  MuteStatus!: boolean;

  // mute belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof mute {
    mute.init({
    muteCase: {
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
    muteEnd: {
      type: DataTypes.DATE,
      allowNull: true
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
    },
    MuteStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'mute',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "mute_mutecase_uindex",
        unique: true,
        fields: [
          { name: "muteCase" },
        ]
      },
      {
        name: "mute_pk",
        unique: true,
        fields: [
          { name: "muteCase" },
        ]
      },
    ]
  });
  return mute;
  }
}
