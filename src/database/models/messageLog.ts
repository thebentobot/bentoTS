import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild.js';

export interface messageLogAttributes {
  guildID: bigint;
  channel: bigint;
}

export type messageLogPk = "guildID";
export type messageLogId = messageLog[messageLogPk];
export type messageLogCreationAttributes = Optional<messageLogAttributes, messageLogPk>;

export class messageLog extends Model<messageLogAttributes, messageLogCreationAttributes> implements messageLogAttributes {
  guildID!: bigint;
  channel!: bigint;

  // messageLog belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof messageLog {
    messageLog.init({
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'guild',
        key: 'guildID'
      }
    },
    channel: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'messageLog',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "messagelog_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "messagelog_pk",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
    ]
  });
  return messageLog;
  }
}
