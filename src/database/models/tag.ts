import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild.js';
import type { user, userId } from './user.js';

export interface tagAttributes {
  tagID?: number;
  userID: bigint;
  guildID: bigint;
  date?: string;
  command: string;
  content: string;
  count: number;
}

export type tagPk = "tagID";
export type tagId = tag[tagPk];
export type tagCreationAttributes = Optional<tagAttributes, tagPk>;

export class tag extends Model<tagAttributes, tagCreationAttributes> implements tagAttributes {
  tagID?: number;
  userID!: bigint;
  guildID!: bigint;
  date?: string;
  command!: string;
  content!: string;
  count!: number;

  // tag belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;
  // tag belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof tag {
    tag.init({
    tagID: {
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
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    command: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tag',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tag_pk",
        unique: true,
        fields: [
          { name: "tagID" },
        ]
      },
      {
        name: "tag_tagid_uindex",
        unique: true,
        fields: [
          { name: "tagID" },
        ]
      },
    ]
  });
  return tag;
  }
}
