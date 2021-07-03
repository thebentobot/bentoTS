import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { user, userId } from './user.js';

export interface weatherAttributes {
  userID: bigint;
  city: string;
}

export type weatherPk = "userID";
export type weatherId = weather[weatherPk];
export type weatherCreationAttributes = Optional<weatherAttributes, weatherPk>;

export class weather extends Model<weatherAttributes, weatherCreationAttributes> implements weatherAttributes {
  userID!: bigint;
  city!: string;

  // weather belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof weather {
    weather.init({
    userID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user',
        key: 'userID'
      }
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'weather',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "weather_pk",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
      {
        name: "weather_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return weather;
  }
}
