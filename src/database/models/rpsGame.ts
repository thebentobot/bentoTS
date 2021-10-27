import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { user, userId } from './user';

export interface rpsGameAttributes {
  id: number;
  userID: bigint;
  paperWins?: number;
  paperLosses?: number;
  rockWins?: number;
  rockLosses?: number;
  scissorWins?: number;
  scissorsLosses?: number;
}

export type rpsGamePk = "id";
export type rpsGameId = rpsGame[rpsGamePk];
export type rpsGameOptionalAttributes = "id" | "paperWins" | "paperLosses" | "rockWins" | "rockLosses" | "scissorWins" | "scissorsLosses";
export type rpsGameCreationAttributes = Optional<rpsGameAttributes, rpsGameOptionalAttributes>;

export class rpsGame extends Model<rpsGameAttributes, rpsGameCreationAttributes> implements rpsGameAttributes {
  id!: number;
  userID!: bigint;
  paperWins?: number;
  paperLosses?: number;
  rockWins?: number;
  rockLosses?: number;
  scissorWins?: number;
  scissorsLosses?: number;

  // rpsGame belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof rpsGame {
    rpsGame.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
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
    paperWins: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    paperLosses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rockWins: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rockLosses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    scissorWins: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    scissorsLosses: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'rpsGame',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "rpsgame_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "rpsgame_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "rpsgame_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return rpsGame;
  }
}
