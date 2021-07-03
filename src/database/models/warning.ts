import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';
import type { user, userId } from './user';

export interface warningAttributes {
  warningCase?: number;
  userID: bigint;
  guildID: bigint;
  date?: Date;
  note?: string;
  actor: bigint;
}

export type warningPk = "warningCase";
export type warningId = warning[warningPk];
export type warningCreationAttributes = Optional<warningAttributes, warningPk>;

export class warning extends Model<warningAttributes, warningCreationAttributes> implements warningAttributes {
  warningCase?: number;
  userID!: bigint;
  guildID!: bigint;
  date?: Date;
  note?: string;
  actor!: bigint;

  // warning belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;
  // warning belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;
  // warning belongsTo user via actor
  actor_user!: user;
  getActor_user!: Sequelize.BelongsToGetAssociationMixin<user>;
  setActor_user!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createActor_user!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof warning {
    warning.init({
    warningCase: {
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
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true
    },
    actor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'user',
        key: 'userID'
      }
    }
  }, {
    sequelize,
    tableName: 'warning',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "warning_actor_uindex",
        unique: true,
        fields: [
          { name: "actor" },
        ]
      },
      {
        name: "warning_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "warning_mutecase_uindex",
        unique: true,
        fields: [
          { name: "warningCase" },
        ]
      },
      {
        name: "warning_pk",
        unique: true,
        fields: [
          { name: "warningCase" },
        ]
      },
      {
        name: "warning_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return warning;
  }
}
