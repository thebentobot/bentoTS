import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';

export interface roleAttributes {
  id?: number;
  roleID: bigint;
  roleCommand: string;
  roleName?: string;
  guildID: bigint;
  type?: "main" | "sub" | "other";
}

export type rolePk = "id";
export type roleId = role[rolePk];
export type roleCreationAttributes = Optional<roleAttributes, rolePk>;

export class role extends Model<roleAttributes, roleCreationAttributes> implements roleAttributes {
  id?: number;
  roleID!: bigint;
  roleCommand!: string;
  roleName?: string;
  guildID!: bigint;
  type?: "main" | "sub" | "other";

  // role belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;

  static initModel(sequelize: Sequelize.Sequelize): typeof role {
    role.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    roleID: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    roleCommand: {
      type: DataTypes.STRING,
      allowNull: false
    },
    roleName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'guild',
        key: 'guildID'
      }
    },
    type: {
      type: DataTypes.ENUM("main","sub","other"),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'role',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "role_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "role_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  return role;
  }
}
