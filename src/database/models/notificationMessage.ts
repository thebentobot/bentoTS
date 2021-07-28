import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { user, userId } from './user';

export interface notificationMessageAttributes {
  id?: number;
  userID: bigint;
  guildID: bigint;
  content: string;
  global?: boolean;
}

export type notificationMessagePk = "id";
export type notificationMessageId = notificationMessage[notificationMessagePk];
export type notificationMessageCreationAttributes = Optional<notificationMessageAttributes, notificationMessagePk>;

export class notificationMessage extends Model<notificationMessageAttributes, notificationMessageCreationAttributes> implements notificationMessageAttributes {
  id?: number;
  userID!: bigint;
  guildID!: bigint;
  content!: string;
  global?: boolean;

  // notificationMessage belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof notificationMessage {
    notificationMessage.init({
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
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    global: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'notificationMessage',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "notificationmessage_id_uindex",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "notificationmessage_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  return notificationMessage;
  }
}
