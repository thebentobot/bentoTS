import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { guild, guildId } from './guild';
import type { user, userId } from './user';

export interface muteAttributes {
  muteCase?: number;
  userID: bigint;
  guildID: bigint;
  date?: Date;
  duration?: number;
  note?: string;
  actor: bigint;
  reason?: string;
}

export type mutePk = "muteCase";
export type muteId = mute[mutePk];
export type muteCreationAttributes = Optional<muteAttributes, mutePk>;

export class mute extends Model<muteAttributes, muteCreationAttributes> implements muteAttributes {
  muteCase?: number;
  userID!: bigint;
  guildID!: bigint;
  date?: Date;
  duration?: number;
  note?: string;
  actor!: bigint;
  reason?: string;

  // mute belongsTo guild via guildID
  guild!: guild;
  getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>;
  setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>;
  createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>;
  // mute belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;
  // mute belongsTo user via actor
  actor_user!: user;
  getActor_user!: Sequelize.BelongsToGetAssociationMixin<user>;
  setActor_user!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createActor_user!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof mute {
    mute.init({
    muteCase: {
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
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'mute',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "mute_mutecase_uindex",
        unique: true,
        fields: [
          { name: "muteCase" },
        ]
      },
      {
        name: "mute_pk",
        unique: true,
        fields: [
          { name: "muteCase" },
        ]
      },
    ]
  });
  return mute;
  }
}
