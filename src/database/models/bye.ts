import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';

export interface byeAttributes {
  guildID: number;
  message: string;
  channel: number;
}

export type byePk = "guildID";
export type byeId = bye[byePk];
export type byeCreationAttributes = Optional<byeAttributes, byePk>;

export class bye extends Model<byeAttributes, byeCreationAttributes> implements byeAttributes {
  guildID!: number;
  message!: string;
  channel!: number;

  // bye belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof bye {
    bye.init({
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
      allowNull: false
    },
    channel: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'bye',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "bye_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "bye_pk",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
    ]
  });
  return bye;
  }
}
