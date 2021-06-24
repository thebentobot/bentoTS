import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { user, userId } from './user';

export interface bentoAttributes {
  userID: bigint;
  bento: number;
  bentoDate?: Date;
}

export type bentoPk = "userID";
export type bentoId = bento[bentoPk];
export type bentoCreationAttributes = Optional<bentoAttributes, bentoPk>;

export class bento extends Model<bentoAttributes, bentoCreationAttributes> implements bentoAttributes {
  userID!: bigint;
  bento!: number;
  bentoDate?: Date;

  // bento belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof bento {
    bento.init({
    userID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user',
        key: 'userID'
      }
    },
    bento: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bentoDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'bento',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "bento_pk",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
      {
        name: "bento_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return bento;
  }
}
