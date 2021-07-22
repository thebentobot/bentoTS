import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface caseGlobalAttributes {
  guildID: bigint;
  serverName: boolean;
  reason: boolean;
}

export type caseGlobalPk = "guildID";
export type caseGlobalId = caseGlobal[caseGlobalPk];
export type caseGlobalCreationAttributes = Optional<caseGlobalAttributes, caseGlobalPk>;

export class caseGlobal extends Model<caseGlobalAttributes, caseGlobalCreationAttributes> implements caseGlobalAttributes {
  guildID!: bigint;
  serverName!: boolean;
  reason!: boolean;


  static initModel(sequelize: Sequelize.Sequelize): typeof caseGlobal {
    caseGlobal.init({
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    serverName: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    reason: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'caseGlobal',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "caseglobal_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "caseglobal_pk",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
    ]
  });
  return caseGlobal;
  }
}
