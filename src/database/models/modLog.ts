import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';

export interface modLogAttributes {
  guildID: number;
  channel: number;
}

export type modLogPk = "guildID";
export type modLogId = modLog[modLogPk];
export type modLogCreationAttributes = Optional<modLogAttributes, modLogPk>;

export class modLog extends Model<modLogAttributes, modLogCreationAttributes> implements modLogAttributes {
  guildID!: number;
  channel!: number;

  // modLog belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof modLog {
    modLog.init({
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
    tableName: 'modLog',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "modlog_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "modlog_pk",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
    ]
  });
  return modLog;
  }
}
