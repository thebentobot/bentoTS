import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild.js';

export interface welcomeAttributes {
  guildID: bigint;
  message?: string;
  channel?: bigint;
}

export type welcomePk = "guildID";
export type welcomeId = welcome[welcomePk];
export type welcomeCreationAttributes = Optional<welcomeAttributes, welcomePk>;

export class welcome extends Model<welcomeAttributes, welcomeCreationAttributes> implements welcomeAttributes {
  guildID!: bigint;
  message?: string;
  channel?: bigint;

  // welcome belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof welcome {
    welcome.init({
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'guild',
        key: 'guildID'
      }
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true
    },
    channel: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'welcome',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "welcome_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "welcome_pk",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
    ]
  });
  return welcome;
  }
}
